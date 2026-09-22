"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet";

export default function Header() {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect, setShowSelector, wallets, selectedWallet } = useWallet();

  const nav = [
    { href: "/", label: "Placemark" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/create", label: "Create" },
    { href: "/evidence", label: "Evidence" },
    { href: "/how", label: "How it works" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#fdfcf8]/90 backdrop-blur border-b border-[#e8e3db]">
      <div className="max-w-[1280px] mx-auto px-6 h-[56px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1a1a1a] text-white flex items-center justify-center font-mono text-[11px] font-bold">P</div>
            <span className="font-serif text-[17px] tracking-tight font-semibold">Placemark</span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-[#6b6b6b] border border-[#e8e3db] px-1.5 py-0.5">GenLayer</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[13px] font-mono tracking-wide transition-colors ${
                    active ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#f5f1e8]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#6b6b6b]">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            StudioNet 61999
            <span className="ml-2 text-[10px] border border-[#e8e3db] px-1">Privy 55537a3130626987d639156d100d67ac</span>
          </div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-mono bg-[#f5f1e8] border border-[#e8e3db] px-2 py-1">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                {selectedWallet && (
                  <span className="text-[9px] font-mono text-[#6b6b6b] mt-0.5">{selectedWallet.name}</span>
                )}
              </div>
              <button onClick={disconnect} className="text-[11px] font-mono text-[#6b6b6b] hover:text-[#1a1a1a] underline">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSelector(true)}
              className="text-[11px] font-mono uppercase tracking-widest bg-[#1a1a1a] text-white px-3 py-1.5 hover:bg-[#2d2d2d] transition-colors flex items-center gap-2"
            >
              <span>Select Wallet</span>
              {wallets.length > 0 && <span className="bg-white text-[#1a1a1a] text-[9px] px-1">{wallets.length}</span>}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
