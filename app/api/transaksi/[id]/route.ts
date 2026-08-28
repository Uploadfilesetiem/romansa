import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Membatalkan transaksi (misalnya salah input / pelanggan ganti pesanan).
// Stok bersama (roti tawar) yang terjual akan dikembalikan otomatis.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: items } = await client.query(
      'SELECT produk_id, qty FROM transaksi_item WHERE transaksi_id = $1',
      [id]
    );

    const totalQty = items.reduce((sum: number, it: any) => sum + it.qty, 0);

    if (totalQty > 0) {
      await client.query(
        'UPDATE stok_master SET stok = stok + $1, updated_at = NOW() WHERE id = 1',
        [totalQty]
      );
      await client.query(
        `INSERT INTO stok_log (produk_id, jenis, jumlah, keterangan)
         VALUES (NULL, 'pembatalan', $1, $2)`,
        [totalQty, `Pembatalan transaksi #${id}`]
      );
    }

    await client.query('DELETE FROM transaksi WHERE id = $1', [id]);

    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
