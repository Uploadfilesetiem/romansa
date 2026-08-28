export type Kategori = 'Campur' | 'Istimewa' | 'Kombinasi' | 'Gurih' | 'Lainnya';

export interface Produk {
  id: number;
  nama: string;
  kategori: Kategori;
  harga: number;
}

// Stok utama (mis. stok roti tawar). Semua menu memakai stok yang sama ini,
// karena setiap menu pada dasarnya memakai 1 lembar/porsi roti tawar.
export interface StokMaster {
  stok: number;
  updated_at?: string;
}

export interface CartItem {
  produkId: number;
  nama: string;
  harga: number;
  qty: number;
}

export interface TransaksiItem {
  id: number;
  produk_id: number;
  nama_produk: string;
  harga: number;
  qty: number;
  subtotal: number;
}

export interface Transaksi {
  id: number;
  kode: string;
  total: number;
  metode_bayar: 'tunai' | 'qris';
  bayar: number;
  kembalian: number;
  created_at: string;
  items?: TransaksiItem[];
}

// Rekap untuk catatan "selai apa yang keluar" pada Laporan.
export interface RekapMenu {
  nama: string;
  qty: number;
  total: number;
}
