import { sql, db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateKodeTransaksi } from '@/lib/format';

// GET /api/transaksi?start=YYYY-MM-DD&end=YYYY-MM-DD&metode=tunai|qris
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const metode = searchParams.get('metode');

    let query = `SELECT * FROM transaksi WHERE 1=1`;
    const values: any[] = [];

    if (start) {
      values.push(start);
      query += ` AND created_at >= $${values.length}::date`;
    }
    if (end) {
      values.push(end);
      query += ` AND created_at < ($${values.length}::date + INTERVAL '1 day')`;
    }
    if (metode) {
      values.push(metode);
      query += ` AND metode_bayar = $${values.length}`;
    }
    query += ` ORDER BY created_at DESC`;

    const client = await db.connect();
    try {
      const { rows: transaksiRows } = await client.query(query, values);

      const ids = transaksiRows.map((t) => t.id);
      let itemsByTransaksi: Record<number, any[]> = {};

      if (ids.length > 0) {
        const { rows: itemRows } = await client.query(
          `SELECT * FROM transaksi_item WHERE transaksi_id = ANY($1::int[])`,
          [ids]
        );
        itemsByTransaksi = itemRows.reduce((acc: Record<number, any[]>, item: any) => {
          acc[item.transaksi_id] = acc[item.transaksi_id] || [];
          acc[item.transaksi_id].push(item);
          return acc;
        }, {});
      }

      const data = transaksiRows.map((t) => ({
        ...t,
        items: itemsByTransaksi[t.id] || [],
      }));

      return NextResponse.json({ ok: true, data });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST /api/transaksi
// body: { items: [{produkId, nama, harga, qty}], metode: 'tunai'|'qris', bayar: number }
//
// Catatan stok: semua menu memakai satu stok bersama (stok roti tawar) di
// tabel stok_master, karena setiap menu pada dasarnya memakai 1 roti tawar.
// Setiap item yang terjual tetap dicatat di stok_log per menu, supaya ada
// catatan/riwayat selai (menu) apa saja yang keluar.
export async function POST(req: Request) {
  const body = await req.json();
  const { items, metode, bayar } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'Keranjang kosong.' }, { status: 400 });
  }
  if (metode !== 'tunai' && metode !== 'qris') {
    return NextResponse.json({ ok: false, error: 'Metode bayar tidak valid.' }, { status: 400 });
  }

  const total = items.reduce((sum: number, it: any) => sum + it.harga * it.qty, 0);
  const totalQty = items.reduce((sum: number, it: any) => sum + it.qty, 0);
  const bayarFinal = metode === 'qris' ? total : Number(bayar);
  const kembalian = metode === 'qris' ? 0 : bayarFinal - total;

  if (metode === 'tunai' && bayarFinal < total) {
    return NextResponse.json({ ok: false, error: 'Uang bayar kurang dari total.' }, { status: 400 });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Pastikan stok roti (bersama) cukup untuk seluruh keranjang.
    const { rows: stokRows } = await client.query(
      'SELECT stok FROM stok_master WHERE id = 1 FOR UPDATE'
    );
    if (stokRows.length === 0) {
      throw new Error('Stok belum diatur. Buka /api/init terlebih dahulu.');
    }
    if (stokRows[0].stok < totalQty) {
      throw new Error(`Stok roti tidak cukup (sisa ${stokRows[0].stok}).`);
    }

    const kode = generateKodeTransaksi();
    const { rows: trxRows } = await client.query(
      `INSERT INTO transaksi (kode, total, metode_bayar, bayar, kembalian)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [kode, total, metode, bayarFinal, kembalian]
    );
    const transaksiId = trxRows[0].id;

    for (const it of items) {
      const subtotal = it.harga * it.qty;
      await client.query(
        `INSERT INTO transaksi_item (transaksi_id, produk_id, nama_produk, harga, qty, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [transaksiId, it.produkId, it.nama, it.harga, it.qty, subtotal]
      );
      // Catatan per menu (selai) yang keluar, walau stoknya bersama.
      await client.query(
        `INSERT INTO stok_log (produk_id, jenis, jumlah, keterangan) VALUES ($1, 'penjualan', $2, $3)`,
        [it.produkId, it.qty, `Transaksi ${kode}`]
      );
    }

    // Potong stok bersama sebanyak total qty yang terjual (lintas menu).
    await client.query(
      'UPDATE stok_master SET stok = stok - $1, updated_at = NOW() WHERE id = 1',
      [totalQty]
    );

    await client.query('COMMIT');

    return NextResponse.json({ ok: true, data: { ...trxRows[0], items } });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
