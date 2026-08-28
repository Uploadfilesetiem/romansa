'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { href: '/', label: 'Kasir' },
  { href: '/stok', label: 'Stok Produk' },
  { href: '/laporan', label: 'Laporan' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-navy text-cream no-print">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-extrabold text-lg leading-tight">ROTI BAKAR ROMANSA</h1>
          <p className="text-xs text-gold italic">&ldquo;Hangat Di Setiap Cerita&rdquo;</p>
        </div>
        <nav className="flex gap-2">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                pathname === m.href
                  ? 'bg-gold text-navy'
                  : 'bg-white/10 hover:bg-white/20 text-cream'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
