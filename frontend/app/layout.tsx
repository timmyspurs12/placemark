import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import Header from "@/components/Header";
import PrivyWrapper from "@/components/PrivyWrapper";

export const metadata = {
  title: "Placemark — Verifiable Ad Placement",
  description: "Turns live publisher pages into verifiable placement evidence using GenLayer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PrivyWrapper>
          <WalletProvider>
            <Header />
            <main>{children}</main>
            <footer className="border-t border-[#e8e3db] mt-16 py-8">
              <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between text-[11px] font-mono text-[#6b6b6b]">
                <span>Placemark • Evidence Lens • GenLayer StudioNet 61999 • Privy 55537a3130626987d639156d100d67ac</span>
                <span>PREDEFINED AGREEMENT → LIVE EVIDENCE → GENLAYER DECISION → ESCROW</span>
              </div>
            </footer>
          </WalletProvider>
        </PrivyWrapper>
      </body>
    </html>
  );
}
