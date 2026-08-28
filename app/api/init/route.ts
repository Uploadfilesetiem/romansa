import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

// Panggil endpoint ini SEKALI setelah deploy pertama kali (buka di browser: /api/init)
// Aman dipanggil berkali-kali, tidak akan duplikat data.
export async function GET() {
  return handleInit();
}

export async function POST() {
  return handleInit();
}

async function handleInit() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS produk (
        id SERIAL PRIMARY KEY,
        nama TEXT NOT NULL UNIQUE,
        kategori TEXT NOT NULL,
        harga INTEGER NOT NULL,
        stok INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transaksi (
        id SERIAL PRIMARY KEY,
        kode TEXT NOT NULL,
        total INTEGER NOT NULL,
        metode_bayar TEXT NOT NULL,
        bayar INTEGER NOT NULL,
        kembalian INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transaksi_item (
        id SERIAL PRIMARY KEY,
        transaksi_id INTEGER NOT NULL REFERENCES transaksi(id) ON DELETE CASCADE,
        produk_id INTEGER,
        nama_produk TEXT NOT NULL,
        harga INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        subtotal INTEGER NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stok_log (
        id SERIAL PRIMARY KEY,
        produk_id INTEGER REFERENCES produk(id) ON DELETE CASCADE,
        jenis TEXT NOT NULL,
        jumlah INTEGER NOT NULL,
        keterangan TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Kompatibilitas untuk database lama: kolom produk_id dulu NOT NULL,
    // sekarang boleh NULL karena stok utama (global) tidak terikat 1 produk.
    await sql`ALTER TABLE stok_log ALTER COLUMN produk_id DROP NOT NULL;`;

    // Stok utama (mis. stok roti tawar). Semua menu memakai satu stok yang sama ini.
    // Nilai default 20, tapi bisa diatur/di-setting kapan saja lewat halaman Stok.
    await sql`
      CREATE TABLE IF NOT EXISTS stok_master (
        id INTEGER PRIMARY KEY DEFAULT 1,
        stok INTEGER NOT NULL DEFAULT 20,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await sql`
      INSERT INTO stok_master (id, stok) VALUES (1, 20)
      ON CONFLICT (id) DO NOTHING;
    `;

    const seed: [string, string, number][] = [
      // CAMPUR
      ['Selai Buah Ekonomis 2 Rasa', 'Campur', 13000],
      ['Double Cokelat', 'Campur', 16000],
      ['Cokelat - Selai Buah', 'Campur', 17000],
      ['Kacang - Selai Buah', 'Campur', 17000],
      ['Keju - Selai Buah', 'Campur', 17000],
      ['Cokelat - Keju', 'Campur', 18000],
      ['Strawberry Blueberry Premium Fill', 'Campur', 18000],
      ['Cokelat - Kacang', 'Campur', 18000],
      ['Kacang - Keju', 'Campur', 18000],
      // ISTIMEWA
      ['Choco Crunchy - Selai Buah', 'Istimewa', 18000],
      ['Oreo - Cokelat', 'Istimewa', 18000],
      ['Tiramisu Crunchy - Cokelat', 'Istimewa', 18000],
      ['Tiramisu Crunchy - Selai Buah', 'Istimewa', 18000],
      ['Choco Crunchy - Keju', 'Istimewa', 20000],
      ['Oreo - Keju', 'Istimewa', 20000],
      ['Double Keju', 'Istimewa', 20000],
      ['Tiramisu Crunchy - Keju', 'Istimewa', 20000],
      ['Double Choco Crunchy', 'Istimewa', 22000],
      // KOMBINASI
      ['Selai Buah 4 Rasa', 'Kombinasi', 15000],
      ['Selai Buah Premium Fill - Selai Buah Ekonomis', 'Kombinasi', 16000],
      ['Cokelat - Strawberry Mix Blueberry Premium Fill', 'Kombinasi', 18000],
      ['Cokelat Mix Keju + Selai Buah', 'Kombinasi', 20000],
      ['Double Cokelat Mix Double Kacang', 'Kombinasi', 22000],
      ['Double Cokelat Mix Double Keju', 'Kombinasi', 22000],
      ['Cokelat Mix Keju - Oreo', 'Kombinasi', 23000],
      ['Double Cokelat Mix Keju + Kacang', 'Kombinasi', 25000],
      // GURIH
      ['Salt Egg', 'Gurih', 24000],
      ['Salt Chicken Patties', 'Gurih', 32000],
      ['Salt Beef Patties', 'Gurih', 36000],
      ['Topping Tambahan', 'Gurih', 3000],
    ];

    for (const [nama, kategori, harga] of seed) {
      await sql`
        INSERT INTO produk (nama, kategori, harga)
        VALUES (${nama}, ${kategori}, ${harga})
        ON CONFLICT (nama) DO NOTHING;
      `;
    }

    return NextResponse.json({ ok: true, message: 'Database siap & menu awal sudah diisi.' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
