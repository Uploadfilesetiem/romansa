import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, nama, kategori, harga, stok
      FROM produk
      ORDER BY kategori, nama;
    `;
    return NextResponse.json({ ok: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, kategori, harga, stok } = body;

    if (!nama || !kategori || harga == null) {
      return NextResponse.json(
        { ok: false, error: 'Nama, kategori, dan harga wajib diisi.' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      INSERT INTO produk (nama, kategori, harga, stok)
      VALUES (${nama}, ${kategori}, ${harga}, ${stok ?? 0})
      RETURNING id, nama, kategori, harga, stok;
    `;

    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
