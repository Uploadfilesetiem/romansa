'use client';

import { useEffect, useState } from 'react';
import { Produk } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

export default function StokPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [modalTambahStok, setModalTambahStok] = useState<Produk | null>(null);
  const [modalEdit, setModalEdit] = useState<Produk | null>(null);
  const [showTambahProduk, setShowTambahProduk] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/produk');
    const json = await res.json();
    if (json.ok) setProdukList(json.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function hapusProduk(id: number) {
    if (!confirm('Hapus produk ini? Riwayat laporan lama tidak akan terhapus.')) return;
    await fetch(`/api/produk/${id}`, { method: 'DELETE' });
    setMsg('Produk dihapus.');
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-xl text-navy">Stok Produk</h1>
        <button
          onClick={() => setShowTambahProduk(true)}
          className="bg-navy text-cream px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Tambah Menu Baru
        </button>
      </div>

      {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-navy text-cream">
            <tr>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Kategori</th>
              <th className="text-right px-3 py-2">Harga</th>
              <th className="text-right px-3 py-2">Stok</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {produkList.map((p) => (
              <tr key={p.id} className="border-b border-navy/10">
                <td className="px-3 py-2">{p.nama}</td>
                <td className="px-3 py-2">{p.kategori}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(p.harga)}</td>
                <td
                  className={`px-3 py-2 text-right font-semibold ${
                    p.stok <= 3 ? 'text-red-500' : ''
                  }`}
                >
                  {p.stok}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setModalTambahStok(p)}
                      className="text-xs bg-gold px-2 py-1 rounded font-semibold"
                    >
                      + Stok
                    </button>
                    <button
                      onClick={() => setModalEdit(p)}
                      className="text-xs bg-navy/10 px-2 py-1 rounded font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => hapusProduk(p.id)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalTambahStok && (
        <TambahStokModal
          produk={modalTambahStok}
          onClose={() => setModalTambahStok(null)}
          onSukses={() => {
            setModalTambahStok(null);
            setMsg('Stok berhasil ditambahkan.');
            load();
          }}
        />
      )}

      {modalEdit && (
        <EditProdukModal
          produk={modalEdit}
          onClose={() => setModalEdit(null)}
          onSukses={() => {
            setModalEdit(null);
            setMsg('Produk berhasil diperbarui.');
            load();
          }}
        />
      )}

      {showTambahProduk && (
        <TambahProdukModal
          onClose={() => setShowTambahProduk(false)}
          onSukses={() => {
            setShowTambahProduk(false);
            setMsg('Menu baru berhasil ditambahkan.');
            load();
          }}
        />
      )}
    </div>
  );
}

function TambahStokModal({
  produk,
  onClose,
  onSukses,
}: {
  produk: Produk;
  onClose: () => void;
  onSukses: () => void;
}) {
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('Pembelian stok');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!jumlah || Number(jumlah) <= 0) {
      setError('Isi jumlah stok yang benar.');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/produk/${produk.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aksi: 'tambah_stok', jumlah: Number(jumlah), keterangan }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error);
      return;
    }
    onSukses();
  }

  return (
    <Modal onClose={onClose} title={`Tambah Stok: ${produk.nama}`}>
      <p className="text-sm text-navy/60 mb-2">Stok saat ini: {produk.stok}</p>
      <label className="text-sm font-semibold">Jumlah Tambahan</label>
      <input
        type="number"
        value={jumlah}
        onChange={(e) => setJumlah(e.target.value)}
        className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1 mb-3"
      />
      <label className="text-sm font-semibold">Keterangan (misal: pembelian bahan)</label>
      <input
        type="text"
        value={keterangan}
        onChange={(e) => setKeterangan(e.target.value)}
        className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full mt-4 bg-navy text-cream font-bold py-2 rounded-lg"
      >
        {loading ? 'Menyimpan...' : 'Simpan'}
      </button>
    </Modal>
  );
}

function EditProdukModal({
  produk,
  onClose,
  onSukses,
}: {
  produk: Produk;
  onClose: () => void;
  onSukses: () => void;
}) {
  const [nama, setNama] = useState(produk.nama);
  const [kategori, setKategori] = useState(produk.kategori);
  const [harga, setHarga] = useState(String(produk.harga));
  const [stok, setStok] = useState(String(produk.stok));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/produk/${produk.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aksi: 'edit',
        nama,
        kategori,
        harga: Number(harga),
        stok: Number(stok),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error);
      return;
    }
    onSukses();
  }

  return (
    <Modal onClose={onClose} title="Edit Produk">
      <FormProduk
        nama={nama}
        setNama={setNama}
        kategori={kategori}
        setKategori={setKategori}
        harga={harga}
        setHarga={setHarga}
        stok={stok}
        setStok={setStok}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full mt-4 bg-navy text-cream font-bold py-2 rounded-lg"
      >
        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </Modal>
  );
}

function TambahProdukModal({ onClose, onSukses }: { onClose: () => void; onSukses: () => void }) {
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Campur');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!nama || !harga) {
      setError('Nama dan harga wajib diisi.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/produk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, kategori, harga: Number(harga), stok: Number(stok) }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error);
      return;
    }
    onSukses();
  }

  return (
    <Modal onClose={onClose} title="Tambah Menu Baru">
      <FormProduk
        nama={nama}
        setNama={setNama}
        kategori={kategori}
        setKategori={setKategori}
        harga={harga}
        setHarga={setHarga}
        stok={stok}
        setStok={setStok}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={loading}
        className="w-full mt-4 bg-navy text-cream font-bold py-2 rounded-lg"
      >
        {loading ? 'Menyimpan...' : 'Tambah Menu'}
      </button>
    </Modal>
  );
}

function FormProduk({ nama, setNama, kategori, setKategori, harga, setHarga, stok, setStok }: any) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold">Nama Menu</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Kategori</label>
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1"
        >
          <option>Campur</option>
          <option>Istimewa</option>
          <option>Kombinasi</option>
          <option>Gurih</option>
          <option>Lainnya</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold">Harga</label>
        <input
          type="number"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Stok</label>
        <input
          type="number"
          value={stok}
          onChange={(e) => setStok(e.target.value)}
          className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1"
        />
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="text-navy/50 text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
