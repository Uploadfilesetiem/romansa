import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

// PATCH: dua mode
// 1) { aksi: 'tambah_stok', jumlah: number, keterangan?: string } -> menambah stok (pembelian barang)
// 2) { aksi: 'edit', nama?, kategori?, harga?, stok? } -> edit data produk langsung
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    const body = await req.json();

    if (body.aksi === 'tambah_stok') {
      const jumlah = Number(body.jumlah);
      if (!jumlah || jumlah <= 0) {
        return NextResponse.json({ ok: false, error: 'Jumlah stok tidak valid.' }, { status: 400 });
      }

      const { rows } = await sql`
        UPDATE produk SET stok = stok + ${jumlah}
        WHERE id = ${id}
        RETURNING id, nama, kategori, harga, stok;
      `;

      await sql`
        INSERT INTO stok_log (produk_id, jenis, jumlah, keterangan)
        VALUES (${id}, 'tambah', ${jumlah}, ${body.keterangan || 'Pembelian stok'});
      `;

      return NextResponse.json({ ok: true, data: rows[0] });
    }

    if (body.aksi === 'edit') {
      const { rows: existingRows } = await sql`SELECT * FROM produk WHERE id = ${id};`;
      if (existingRows.length === 0) {
        return NextResponse.json({ ok: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
      }
      const existing = existingRows[0];

      const nama = body.nama ?? existing.nama;
      const kategori = body.kategori ?? existing.kategori;
      const harga = body.harga ?? existing.harga;
      const stok = body.stok ?? existing.stok;

      const { rows } = await sql`
        UPDATE produk SET nama = ${nama}, kategori = ${kategori}, harga = ${harga}, stok = ${stok}
        WHERE id = ${id}
        RETURNING id, nama, kategori, harga, stok;
      `;

      return NextResponse.json({ ok: true, data: rows[0] });
    }

    return NextResponse.json({ ok: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    await sql`DELETE FROM produk WHERE id = ${id};`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
