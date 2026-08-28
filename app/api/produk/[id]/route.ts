import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

// PATCH: { aksi: 'edit', nama?, kategori?, harga? } -> edit data produk
// (stok tidak lagi per produk, gunakan /api/stok untuk stok bersama)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  try {
    const body = await req.json();

    if (body.aksi === 'edit') {
      const { rows: existingRows } = await sql`SELECT * FROM produk WHERE id = ${id};`;
      if (existingRows.length === 0) {
        return NextResponse.json({ ok: false, error: 'Produk tidak ditemukan.' }, { status: 404 });
      }
      const existing = existingRows[0];

      const nama = body.nama ?? existing.nama;
      const kategori = body.kategori ?? existing.kategori;
      const harga = body.harga ?? existing.harga;

      const { rows } = await sql`
        UPDATE produk SET nama = ${nama}, kategori = ${kategori}, harga = ${harga}
        WHERE id = ${id}
        RETURNING id, nama, kategori, harga;
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
