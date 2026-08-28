'use client';

import { useEffect, useState } from 'react';
import { Produk } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

export default function StokPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [stokRoti, setStokRoti] = useState<number>(0);
  const [modalAturStok, setModalAturStok] = useState(false);
  const [modalTambahStok, setModalTambahStok] = useState(false);
  const [modalEdit, setModalEdit] = useState<Produk | null>(null);
  const [showTambahProduk, setShowTambahProduk] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/produk');
    const json = await res.json();
    if (json.ok) setProdukList(json.data);
  }

  async function loadStok() {
    const res = await fetch('/api/stok');
    const json = await res.json();
    if (json.ok) setStokRoti(json.data.stok);
  }

  useEffect(() => {
    load();
    loadStok();
  }, []);

  async function hapusProduk(id: number) {
    if (!confirm('Hapus menu ini? Riwayat laporan lama tidak akan terhapus.')) return;
    await fetch(`/api/produk/${id}`, { method: 'DELETE' });
    setMsg('Menu dihapus.');
    load();
  }

  return (
    <div>
      <h1 className="font-bold text-xl text-navy mb-4">Stok & Menu</h1>

      {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}

      {/* Stok bersama: dipakai oleh SEMUA menu, karena semua menu memakai roti tawar. */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-navy">Stok Roti Tawar (Stok Bersama)</p>
            <p className="text-xs text-navy/60 mt-0.5">
              Semua menu ikut mengurangi stok ini, karena setiap menu memakai 1 roti tawar.
            </p>
            <p
              className={`text-2xl font-extrabold mt-2 ${
                stokRoti <= 5 ? 'text-red-500' : 'text-navy'
              }`}
            >
              {stokRoti} <span className="text-sm font-normal text-navy/50">lembar/porsi</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalTambahStok(true)}
              className="text-sm bg-gold px-3 py-2 rounded-lg font-semibold"
            >
              + Tambah Stok
            </button>
            <button
              onClick={() => setModalAturStok(true)}
              className="text-sm bg-navy/10 px-3 py-2 rounded-lg font-semibold text-navy"
            >
              Atur / Setting
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-navy">Daftar Menu</h2>
        <button
          onClick={() => setShowTambahProduk(true)}
          className="bg-navy text-cream px-4 py-2 rounded-lg text-sm font-semibold"
        >
          + Tambah Menu Baru
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-navy text-cream">
            <tr>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Kategori</th>
              <th className="text-right px-3 py-2">Harga</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {produkList.map((p) => (
              <tr key={p.id} className="border-b border-navy/10">
                <td className="px-3 py-2">{p.nama}</td>
                <td className="px-3 py-2">{p.kategori}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(p.harga)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-2 flex-wrap">
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
        <TambahStokMasterModal
          stokSaatIni={stokRoti}
          onClose={() => setModalTambahStok(false)}
          onSukses={() => {
            setModalTambahStok(false);
            setMsg('Stok roti tawar berhasil ditambahkan.');
            loadStok();
          }}
        />
      )}

      {modalAturStok && (
        <AturStokMasterModal
          stokSaatIni={stokRoti}
          onClose={() => setModalAturStok(false)}
          onSukses={() => {
            setModalAturStok(false);
            setMsg('Stok roti tawar berhasil diperbarui.');
            loadStok();
          }}
        />
      )}

      {modalEdit && (
        <EditProdukModal
          produk={modalEdit}
          onClose={() => setModalEdit(null)}
          onSukses={() => {
            setModalEdit(null);
            setMsg('Menu berhasil diperbarui.');
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

function TambahStokMasterModal({
  stokSaatIni,
  onClose,
  onSukses,
}: {
  stokSaatIni: number;
  onClose: () => void;
  onSukses: () => void;
}) {
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('Pembelian roti tawar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!jumlah || Number(jumlah) <= 0) {
      setError('Isi jumlah stok yang benar.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/stok', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aksi: 'tambah', jumlah: Number(jumlah), keterangan }),
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
    <Modal onClose={onClose} title="Tambah Stok Roti Tawar">
      <p className="text-sm text-navy/60 mb-2">Stok saat ini: {stokSaatIni}</p>
      <label className="text-sm font-semibold">Jumlah Tambahan</label>
      <input
        type="number"
        value={jumlah}
        onChange={(e) => setJumlah(e.target.value)}
        className="w-full border border-navy/20 rounded-lg px-3 py-2 mt-1 mb-3"
      />
      <label className="text-sm font-semibold">Keterangan</label>
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

function AturStokMasterModal({
  stokSaatIni,
  onClose,
  onSukses,
}: {
  stokSaatIni: number;
  onClose: () => void;
  onSukses: () => void;
}) {
  const [stok, setStok] = useState(String(stokSaatIni));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (stok === '' || Number(stok) < 0) {
      setError('Isi jumlah stok yang benar.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/stok', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aksi: 'set', stok: Number(stok) }),
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
    <Modal onClose={onClose} title="Atur / Setting Stok Roti Tawar">
      <p className="text-sm text-navy/60 mb-2">
        Gunakan ini untuk mengatur ulang nilai stok, misalnya saat mulai buka toko
        (contoh: 20 lembar), atau setelah stock opname.
      </p>
      <label className="text-sm font-semibold">Jumlah Stok</label>
      <input
        type="number"
        value={stok}
        onChange={(e) => setStok(e.target.value)}
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
    <Modal onClose={onClose} title="Edit Menu">
      <FormProduk
        nama={nama}
        setNama={setNama}
        kategori={kategori}
        setKategori={setKategori}
        harga={harga}
        setHarga={setHarga}
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
      body: JSON.stringify({ nama, kategori, harga: Number(harga) }),
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
      />
      <p className="text-xs text-navy/50 mt-2">
        Menu baru otomatis memakai stok bersama (Stok Roti Tawar) di atas.
      </p>
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

function FormProduk({ nama, setNama, kategori, setKategori, harga, setHarga }: any) {
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
