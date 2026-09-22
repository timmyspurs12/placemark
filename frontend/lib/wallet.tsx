"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface WalletInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: any;
}

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: (wallet?: WalletInfo) => Promise<void>;
  disconnect: () => void;
  showSelector: boolean;
  setShowSelector: (show: boolean) => void;
  wallets: WalletInfo[];
  selectedWallet: WalletInfo | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  showSelector: false,
  setShowSelector: () => {},
  wallets: [],
  selectedWallet: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);

  // EIP-6963 wallet discovery - NO AUTO CONNECT
  useEffect(() => {
    const discovered = new Map<string, WalletInfo>();

    function onAnnounce(event: any) {
      const { info, provider } = event.detail;
      const walletInfo: WalletInfo = {
        uuid: info.uuid,
        name: info.name,
        icon: info.icon,
        rdns: info.rdns,
        provider: provider,
      };
      if (!discovered.has(info.uuid)) {
        discovered.set(info.uuid, walletInfo);
        setWallets(Array.from(discovered.values()));
      }
    }

    window.addEventListener("eip6963:announceProvider" as any, onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Fallback: check for injected wallets after short delay
    const timeout = setTimeout(() => {
      if (discovered.size === 0 && (window as any).ethereum) {
        const eth = (window as any).ethereum;
        // Handle multiple providers
        const providers = eth.providers || [eth];
        const fallbackWallets: WalletInfo[] = providers.map((p: any, i: number) => ({
          uuid: `injected-${i}`,
          name: p.isMetaMask ? "MetaMask" : p.isCoinbaseWallet ? "Coinbase Wallet" : `Injected Wallet ${i + 1}`,
          icon: "",
          rdns: `injected-${i}`,
          provider: p,
        }));
        if (fallbackWallets.length > 0) {
          setWallets(fallbackWallets);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener("eip6963:announceProvider" as any, onAnnounce);
      clearTimeout(timeout);
    };
  }, []);

  // NO auto-connect from localStorage - user must explicitly select
  // Only restore if user previously connected AND explicitly wants it
  // We intentionally do NOT auto-connect on page load

  const connect = async (wallet?: WalletInfo) => {
    try {
      let provider = wallet?.provider;
      
      // If no wallet specified, show selector
      if (!provider) {
        if (wallets.length === 0) {
          // No wallets discovered, try generic ethereum
          if ((window as any).ethereum) {
            provider = (window as any).ethereum;
          } else {
            alert("No wallet found. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.");
            return;
          }
        } else if (wallets.length === 1) {
          // Single wallet, use it directly
          provider = wallets[0].provider;
          setSelectedWallet(wallets[0]);
        } else {
          // Multiple wallets, show selector
          setShowSelector(true);
          return;
        }
      } else {
        setSelectedWallet(wallet || null);
      }

      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        localStorage.setItem("placemark_wallet", accounts[0]);
        localStorage.setItem("placemark_wallet_id", wallet?.uuid || "injected");
        setShowSelector(false);

        // Try to switch to GenLayer chain
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xf21f" }], // 61999 in hex
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xf21f",
                  chainName: "GenLayer StudioNet",
                  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                  rpcUrls: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"],
                },
              ],
            });
          }
        }
      }
    } catch (e) {
      console.error("Wallet connect failed:", e);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setSelectedWallet(null);
    localStorage.removeItem("placemark_wallet");
    localStorage.removeItem("placemark_wallet_id");
  };

  return (
    <WalletContext.Provider value={{ address, isConnected: !!address, connect, disconnect, showSelector, setShowSelector, wallets, selectedWallet }}>
      {children}
      {showSelector && (
        <WalletSelectorModal
          wallets={wallets}
          onSelect={(w) => connect(w)}
          onClose={() => setShowSelector(false)}
        />
      )}
    </WalletContext.Provider>
  );
}

function WalletSelectorModal({ wallets, onSelect, onClose }: { wallets: WalletInfo[]; onSelect: (w: WalletInfo) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-[#e8e3db] shadow-2xl w-[380px] max-w-[90vw]">
        <div className="border-b border-[#e8e3db] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-serif text-[16px] font-bold">Select Wallet</div>
            <div className="font-mono text-[11px] text-[#6b6b6b] mt-0.5">Choose how to connect to Placemark</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 border border-[#e8e3db] flex items-center justify-center hover:bg-[#f5f1e8] text-[#6b6b6b]">✕</button>
        </div>

        <div className="p-3 space-y-2 max-h-[320px] overflow-auto">
          {wallets.length === 0 ? (
            <div className="p-4 text-center">
              <div className="font-mono text-[12px] text-[#6b6b6b] mb-3">No wallets detected</div>
              <div className="text-[11px] text-[#6b6b6b] leading-relaxed">
                Install MetaMask, Coinbase Wallet, or another EIP-6963 compatible wallet.
                <br />
                <a href="https://metamask.io" target="_blank" className="text-[#4f46e5] underline">Get MetaMask →</a>
              </div>
            </div>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.uuid}
                onClick={() => onSelect(wallet)}
                className="w-full flex items-center gap-3 border border-[#e8e3db] bg-[#fdfcf8] hover:bg-white hover:border-[#1a1a1a] p-3 text-left transition-colors group"
              >
                <div className="w-8 h-8 bg-white border border-[#e8e3db] flex items-center justify-center overflow-hidden">
                  {wallet.icon ? (
                    <img src={wallet.icon} alt={wallet.name} className="w-5 h-5" />
                  ) : (
                    <span className="font-mono text-[10px] font-bold">{wallet.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium group-hover:underline">{wallet.name}</div>
                  <div className="font-mono text-[10px] text-[#6b6b6b]">{wallet.rdns}</div>
                </div>
                <div className="text-[11px] font-mono text-[#6b6b6b] group-hover:text-[#1a1a1a]">→</div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[#e8e3db] bg-[#fdfcf8] px-4 py-3">
          <div className="font-mono text-[10px] text-[#6b6b6b] leading-relaxed">
            Placemark will not auto-connect. You must explicitly select a wallet. Your selection is required to sign GenLayer transactions for placement verification.
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
            <span className="bg-[#1a1a1a] text-white px-1.5 py-0.5">Privy</span>
            <span className="text-[#6b6b6b]">ID: 55537a3130626987d639156d100d67ac • Secure wallet selection</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
