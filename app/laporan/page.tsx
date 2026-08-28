'use client';

import { useEffect, useMemo, useState } from 'react';
import { Transaksi, RekapMenu } from '@/lib/types';
import { formatRupiah, formatTanggal } from '@/lib/format';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function LaporanPage() {
  const [start, setStart] = useState(todayStr());
  const [end, setEnd] = useState(todayStr());
  const [data, setData] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ start, end });
    const res = await fetch(`/api/transaksi?${params.toString()}`);
    const json = await res.json();
    if (json.ok) setData(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalTunai = useMemo(
    () => data.filter((t) => t.metode_bayar === 'tunai').reduce((s, t) => s + t.total, 0),
    [data]
  );
  const totalQris = useMemo(
    () => data.filter((t) => t.metode_bayar === 'qris').reduce((s, t) => s + t.total, 0),
    [data]
  );
  const grandTotal = totalTunai + totalQris;

  // Catatan: rekap selai/menu apa saja yang keluar & berapa banyak, pada periode ini.
  const rekapMenu: RekapMenu[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    data.forEach((t) => {
      (t.items || []).forEach((it) => {
        const cur = map.get(it.nama_produk) || { qty: 0, total: 0 };
        cur.qty += it.qty;
        cur.total += it.subtotal;
        map.set(it.nama_produk, cur);
      });
    });
    return Array.from(map.entries())
      .map(([nama, v]) => ({ nama, qty: v.qty, total: v.total }))
      .sort((a, b) => b.qty - a.qty);
  }, [data]);
  const totalQtyTerjual = useMemo(
    () => rekapMenu.reduce((s, r) => s + r.qty, 0),
    [rekapMenu]
  );

  async function batalkanTransaksi(id: number) {
    if (!confirm('Batalkan transaksi ini? Stok akan dikembalikan.')) return;
    await fetch(`/api/transaksi/${id}`, { method: 'DELETE' });
    load();
  }

  async function unduhPDF() {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ROTI BAKAR ROMANSA', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('"Hangat Di Setiap Cerita"', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Laporan Penjualan`, 14, 32);
    doc.text(`Periode: ${start} s/d ${end}`, 14, 38);

    autoTable(doc, {
      startY: 44,
      head: [['Kode', 'Tanggal', 'Metode', 'Item', 'Total']],
      body: data.map((t) => [
        t.kode,
        formatTanggal(t.created_at),
        t.metode_bayar.toUpperCase(),
        (t.items || []).map((it) => `${it.nama_produk} x${it.qty}`).join(', '),
        formatRupiah(t.total),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [28, 35, 64] },
      columnStyles: { 3: { cellWidth: 70 } },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;

    autoTable(doc, {
      startY: finalY + 6,
      body: [
        ['Total Tunai', formatRupiah(totalTunai)],
        ['Total QRIS', formatRupiah(totalQris)],
        ['Grand Total', formatRupiah(grandTotal)],
        ['Jumlah Transaksi', String(data.length)],
      ],
      theme: 'plain',
      styles: { fontSize: 10, fontStyle: 'bold' },
    });

    const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 30;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan Selai/Menu Keluar', 14, finalY2 + 10);

    autoTable(doc, {
      startY: finalY2 + 14,
      head: [['Menu / Selai', 'Qty Terjual', 'Omzet']],
      body: rekapMenu.map((r) => [r.nama, String(r.qty), formatRupiah(r.total)]),
      foot: [['Total', String(totalQtyTerjual), formatRupiah(grandTotal)]],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [28, 35, 64] },
      footStyles: { fillColor: [230, 230, 230], textColor: [28, 35, 64], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });

    doc.save(`Laporan-RotiBakarRomansa-${start}_${end}.pdf`);
  }

  return (
    <div>
      <h1 className="font-bold text-xl text-navy mb-4">Laporan Penjualan</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm font-semibold block">Dari Tanggal</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border border-navy/20 rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block">Sampai Tanggal</label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border border-navy/20 rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <button
          onClick={load}
          className="bg-navy text-cream px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Tampilkan
        </button>
        <button
          onClick={unduhPDF}
          disabled={data.length === 0}
          className="bg-gold text-navy px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
        >
          Unduh PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SummaryCard label="Total Tunai" value={formatRupiah(totalTunai)} />
        <SummaryCard label="Total QRIS" value={formatRupiah(totalQris)} />
        <SummaryCard label="Grand Total" value={formatRupiah(grandTotal)} highlight />
        <SummaryCard label="Jumlah Transaksi" value={String(data.length)} />
      </div>

      {/* Catatan: rekap selai/menu apa yang keluar pada periode ini */}
      <div className="bg-white rounded-xl shadow overflow-x-auto mb-4">
        <div className="px-3 py-2 border-b border-navy/10">
          <h2 className="font-bold text-navy text-sm">Catatan Selai/Menu Keluar</h2>
          <p className="text-xs text-navy/50">
            Rekap jumlah tiap menu (selai) yang terjual pada periode ini, dari yang paling laris.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy/5 text-navy">
            <tr>
              <th className="text-left px-3 py-2">Menu / Selai</th>
              <th className="text-right px-3 py-2">Qty Terjual</th>
              <th className="text-right px-3 py-2">Omzet</th>
            </tr>
          </thead>
          <tbody>
            {rekapMenu.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-navy/50">
                  Belum ada menu yang terjual pada periode ini.
                </td>
              </tr>
            )}
            {rekapMenu.map((r) => (
              <tr key={r.nama} className="border-b border-navy/10">
                <td className="px-3 py-2">{r.nama}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.qty}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(r.total)}</td>
              </tr>
            ))}
          </tbody>
          {rekapMenu.length > 0 && (
            <tfoot>
              <tr className="bg-navy/5 font-bold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{totalQtyTerjual}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(grandTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-navy text-cream">
            <tr>
              <th className="text-left px-3 py-2">Kode</th>
              <th className="text-left px-3 py-2">Tanggal</th>
              <th className="text-left px-3 py-2">Metode</th>
              <th className="text-left px-3 py-2">Item</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-navy/50">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-navy/50">
                  Belum ada transaksi pada periode ini.
                </td>
              </tr>
            )}
            {data.map((t) => (
              <tr key={t.id} className="border-b border-navy/10 align-top">
                <td className="px-3 py-2">{t.kode}</td>
                <td className="px-3 py-2">{formatTanggal(t.created_at)}</td>
                <td className="px-3 py-2 uppercase">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.metode_bayar === 'qris'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {t.metode_bayar}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-navy/70">
                  {(t.items || []).map((it) => `${it.nama_produk} x${it.qty}`).join(', ')}
                </td>
                <td className="px-3 py-2 text-right font-semibold">{formatRupiah(t.total)}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => batalkanTransaksi(t.id)}
                    className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold"
                  >
                    Batalkan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl shadow p-3 ${
        highlight ? 'bg-navy text-cream' : 'bg-white text-navy'
      }`}
    >
      <p className="text-xs opacity-70">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}
