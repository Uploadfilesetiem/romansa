'use client';

import { useEffect, useMemo, useState } from 'react';
import { Produk, CartItem, Kategori } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

const URUTAN_KATEGORI: Kategori[] = ['Campur', 'Istimewa', 'Kombinasi', 'Gurih', 'Lainnya'];

export default function KasirPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metode, setMetode] = useState<'tunai' | 'qris'>('tunai');
  const [bayarInput, setBayarInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [struk, setStruk] = useState<any>(null);
  const [kategoriAktif, setKategoriAktif] = useState<string>('Semua');

  async function loadProduk() {
    const res = await fetch('/api/produk');
    const json = await res.json();
    if (json.ok) setProdukList(json.data);
  }

  useEffect(() => {
    loadProduk();
  }, []);

  const totalCart = useMemo(
    () => cart.reduce((sum, it) => sum + it.harga * it.qty, 0),
    [cart]
  );

  const bayar = metode === 'qris' ? totalCart : Number(bayarInput || 0);
  const kembalian = metode === 'qris' ? 0 : bayar - totalCart;

  function tambahKeCart(p: Produk) {
    setError('');
    setCart((prev) => {
      const existing = prev.find((it) => it.produkId === p.id);
      const qtyDiCart = existing ? existing.qty : 0;
      if (qtyDiCart + 1 > p.stok) {
        setError(`Stok "${p.nama}" tidak cukup (sisa ${p.stok}).`);
        return prev;
      }
      if (existing) {
        return prev.map((it) =>
          it.produkId === p.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { produkId: p.id, nama: p.nama, harga: p.harga, qty: 1, stok: p.stok }];
    });
  }

  function ubahQty(produkId: number, delta: number) {
    setError('');
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.produkId !== produkId) return it;
          const newQty = it.qty + delta;
          if (newQty > it.stok) {
            setError(`Stok "${it.nama}" tidak cukup (sisa ${it.stok}).`);
            return it;
          }
          return { ...it, qty: newQty };
        })
        .filter((it) => it.qty > 0)
    );
  }

  function hapusItem(produkId: number) {
    setCart((prev) => prev.filter((it) => it.produkId !== produkId));
  }

  function resetKasir() {
    setCart([]);
    setBayarInput('');
    setMetode('tunai');
    setError('');
  }

  async function prosesBayar() {
    setError('');
    if (cart.length === 0) {
      setError('Keranjang masih kosong.');
      return;
    }
    if (metode === 'tunai' && bayar < totalCart) {
      setError('Uang bayar kurang dari total belanja.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((it) => ({
            produkId: it.produkId,
            nama: it.nama,
            harga: it.harga,
            qty: it.qty,
          })),
          metode,
          bayar,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Gagal memproses pembayaran.');
        setLoading(false);
        return;
      }
      setStruk(json.data);
      resetKasir();
      await loadProduk();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const kategoriTersedia = ['Semua', ...URUTAN_KATEGORI.filter((k) =>
    produkList.some((p) => p.kategori === k)
  )];

  const produkFiltered =
    kategoriAktif === 'Semua'
      ? produkList
      : produkList.filter((p) => p.kategori === kategoriAktif);

  const grouped = URUTAN_KATEGORI.map((kat) => ({
    kategori: kat,
    items: produkFiltered.filter((p) => p.kategori === kat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu */}
      <div className="lg:col-span-2">
        <div className="flex gap-2 flex-wrap mb-4 no-print">
          {kategoriTersedia.map((k) => (
            <button
              key={k}
              onClick={() => setKategoriAktif(k)}
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                kategoriAktif === k
                  ? 'bg-navy text-cream border-navy'
                  : 'bg-white text-navy border-navy/30'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {grouped.map((g) => (
          <div key={g.kategori} className="mb-6">
            <h2 className="font-bold text-navy mb-2 uppercase tracking-wide text-sm">
              {g.kategori}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {g.items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => tambahKeCart(p)}
                  disabled={p.stok <= 0}
                  className="bg-white rounded-xl shadow p-3 text-left hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed border border-navy/10"
                >
                  <p className="font-semibold text-sm leading-tight">{p.nama}</p>
                  <p className="text-gold font-bold mt-1">{formatRupiah(p.harga)}</p>
                  <p className="text-xs text-navy/60 mt-1">Stok: {p.stok}</p>
                </button>
              ))}
            </div>
          </div>
        ))}

        {produkList.length === 0 && (
          <p className="text-sm text-navy/60">
            Belum ada menu. Buka <code>/api/init</code> sekali di browser untuk mengisi menu awal.
          </p>
        )}
      </div>

      {/* Keranjang */}
      <div className="bg-white rounded-xl shadow p-4 h-fit sticky top-4">
        <h2 className="font-bold text-navy mb-3">Keranjang</h2>

        {cart.length === 0 && <p className="text-sm text-navy/50">Belum ada item.</p>}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {cart.map((it) => (
            <div key={it.produkId} className="flex items-center justify-between text-sm">
              <div className="flex-1 pr-2">
                <p className="font-medium leading-tight">{it.nama}</p>
                <p className="text-navy/60">{formatRupiah(it.harga)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => ubahQty(it.produkId, -1)}
                  className="w-6 h-6 rounded bg-navy/10 font-bold"
                >
                  -
                </button>
                <span className="w-5 text-center">{it.qty}</span>
                <button
                  onClick={() => ubahQty(it.produkId, 1)}
                  className="w-6 h-6 rounded bg-navy/10 font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => hapusItem(it.produkId)}
                  className="text-red-500 text-xs ml-1"
                >
                  hapus
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-navy/10 mt-3 pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatRupiah(totalCart)}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold mb-1">Metode Bayar</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMetode('tunai')}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border ${
                metode === 'tunai' ? 'bg-gold border-gold' : 'bg-white border-navy/20'
              }`}
            >
              Tunai
            </button>
            <button
              onClick={() => setMetode('qris')}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border ${
                metode === 'qris' ? 'bg-gold border-gold' : 'bg-white border-navy/20'
              }`}
            >
              QRIS
            </button>
          </div>
        </div>

        {metode === 'tunai' && (
          <div className="mt-3">
            <label className="text-sm font-semibold">Uang Diterima</label>
            <input
              type="number"
              value={bayarInput}
              onChange={(e) => setBayarInput(e.target.value)}
              placeholder="0"
              className="w-full mt-1 border border-navy/20 rounded-lg px-3 py-2"
            />
            <div className="flex justify-between mt-2 text-sm">
              <span>Kembalian</span>
              <span className="font-bold">
                {formatRupiah(kembalian > 0 ? kembalian : 0)}
              </span>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          onClick={prosesBayar}
          disabled={loading || cart.length === 0}
          className="w-full mt-4 bg-navy text-cream font-bold py-2.5 rounded-lg disabled:opacity-40"
        >
          {loading ? 'Memproses...' : 'Bayar'}
        </button>
      </div>

      {struk && <StrukModal data={struk} onClose={() => setStruk(null)} />}
    </div>
  );
}

function StrukModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 no-print">
      <div className="bg-white rounded-xl p-5 w-full max-w-sm">
        <div id="struk-print">
          <h3 className="font-extrabold text-center">ROTI BAKAR ROMANSA</h3>
          <p className="text-center text-xs text-navy/60 mb-3">Hangat Di Setiap Cerita</p>
          <p className="text-xs">Kode: {data.kode}</p>
          <p className="text-xs mb-2">{new Date(data.created_at).toLocaleString('id-ID')}</p>
          <div className="border-t border-dashed border-navy/30 my-2" />
          {data.items.map((it: any, i: number) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span>
                {it.nama} x{it.qty}
              </span>
              <span>{formatRupiah(it.harga * it.qty)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-navy/30 my-2" />
          <div className="flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>{formatRupiah(data.total)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Metode</span>
            <span className="uppercase">{data.metode_bayar}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Bayar</span>
            <span>{formatRupiah(data.bayar)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Kembalian</span>
            <span>{formatRupiah(data.kembalian)}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 no-print">
          <button
            onClick={() => window.print()}
            className="flex-1 border border-navy/20 rounded-lg py-2 text-sm font-semibold"
          >
            Cetak
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-navy text-cream rounded-lg py-2 text-sm font-semibold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
