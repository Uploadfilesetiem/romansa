export type Kategori = 'Campur' | 'Istimewa' | 'Kombinasi' | 'Gurih' | 'Lainnya';

export interface Produk {
  id: number;
  nama: string;
  kategori: Kategori;
  harga: number;
  stok: number;
}

export interface CartItem {
  produkId: number;
  nama: string;
  harga: number;
  qty: number;
  stok: number;
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
