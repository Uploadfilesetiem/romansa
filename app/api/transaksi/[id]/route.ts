import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Membatalkan transaksi (misalnya salah input / pelanggan ganti pesanan).
// Stok produk yang terjual akan dikembalikan otomatis.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows: items } = await client.query(
      'SELECT produk_id, qty FROM transaksi_item WHERE transaksi_id = $1',
      [id]
    );

    for (const it of items) {
      if (it.produk_id) {
        await client.query('UPDATE produk SET stok = stok + $1 WHERE id = $2', [
          it.qty,
          it.produk_id,
        ]);
      }
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
