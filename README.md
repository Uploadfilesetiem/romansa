# Kasir Roti Bakar Romansa

Aplikasi kasir (POS) untuk **Roti Bakar Romansa** — dibuat dengan Next.js dan database
PostgreSQL (Vercel Postgres), siap deploy ke **Vercel**.

## Fitur
- Kasir: pilih menu (sesuai kategori Campur / Istimewa / Kombinasi / Gurih), keranjang belanja,
  hitung total & kembalian otomatis.
- Pembayaran dipisah **Tunai** dan **QRIS**.
- Stok otomatis berkurang saat transaksi, dan bisa **tambah stok** (pembelian barang) atau
  tambah menu baru dari halaman Stok Produk.
- Laporan transaksi dengan filter tanggal, **total Tunai, total QRIS, dan grand total** terpisah,
  serta tombol **Unduh PDF** (rapi untuk dikirim ke bos).
- Batalkan transaksi (stok otomatis dikembalikan) kalau ada salah input.

## 1. Jalankan di Komputer (opsional, untuk uji coba)

```bash
npm install
```

Buat file `.env.local` berisi koneksi database (isi didapat dari langkah Vercel Postgres di bawah):

```
POSTGRES_URL="..."
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
```

Jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000/api/init` sekali di browser untuk membuat tabel & mengisi menu awal,
lalu buka `http://localhost:3000`.

## 2. Deploy ke Vercel

1. Buat repository GitHub baru, lalu upload semua isi folder ini (`git init`, `git add .`,
   `git commit -m "init"`, push ke GitHub).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repository tadi → Deploy.
3. Setelah project dibuat, buka tab **Storage** di dashboard Vercel project ini →
   **Create Database** → pilih **Postgres** → ikuti langkahnya → klik **Connect** ke project ini.
   Vercel otomatis menambahkan environment variable `POSTGRES_URL` dkk ke project.
4. Buka tab **Deployments** → klik **Redeploy** (supaya environment variable database terpakai).
5. Setelah deploy selesai, buka **`https://nama-project-anda.vercel.app/api/init`** satu kali
   di browser. Ini akan membuat semua tabel database dan mengisi menu awal sesuai foto menu.
6. Selesai! Buka domain Vercel Anda untuk mulai memakai aplikasi kasir.

> `/api/init` aman dipanggil berkali-kali (tidak akan menduplikat menu), jadi tidak masalah
> kalau tidak sengaja terbuka lagi.

## 3. Struktur Halaman

- `/` — Halaman Kasir (transaksi harian)
- `/stok` — Kelola stok & menu (tambah stok, tambah menu baru, edit harga)
- `/laporan` — Laporan penjualan, ringkasan Tunai vs QRIS, unduh PDF

## Catatan

- Semua data (menu, stok, transaksi) tersimpan permanen di database Postgres, bukan di
  penyimpanan browser — jadi aman walau HP/laptop kasir berganti, dan bisa dibuka dari
  banyak perangkat sekaligus.
- Kalau nanti ingin menambah kategori menu baru selain Campur/Istimewa/Kombinasi/Gurih,
  tinggal pilih "Lainnya" saat tambah menu, atau edit pilihan kategori di
  `components` dan `app/stok/page.tsx`.
