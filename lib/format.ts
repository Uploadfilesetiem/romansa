export function formatRupiah(angka: number): string {
  return 'Rp' + Math.round(angka).toLocaleString('id-ID');
}

export function formatTanggal(tgl: string | Date): string {
  const d = new Date(tgl);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateKodeTransaksi(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp =
    now.getFullYear().toString().slice(2) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 900 + 100);
  return `RBR-${stamp}${rand}`;
}
