"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { getGenlayerClient, CONTRACT_ADDRESS, DEFAULT_REQUIREMENTS, parseGenToWei, Requirement } from "@/lib/genlayer";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const { address, isConnected, connect } = useWallet();
  const router = useRouter();

  const [campaignName, setCampaignName] = useState("Homepage Hero Placement");
  const [targetUrl, setTargetUrl] = useState("https://example.com");
  const [adIdentity, setAdIdentity] = useState("ACME");
  const [escrow, setEscrow] = useState("0.2");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [requirements, setRequirements] = useState<Requirement[]>(DEFAULT_REQUIREMENTS);
  const [txState, setTxState] = useState<"IDLE" | "SIGNING" | "SUBMITTED" | "PENDING" | "FINALIZING" | "FINALIZED" | "FAILED">("IDLE");
  const [txHash, setTxHash] = useState("");
  const [agreementId, setAgreementId] = useState("");

  const updateReq = (id: string, text: string) => {
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const addReq = () => {
    if (requirements.length >= 10) return;
    const nextId = String(requirements.length + 1).padStart(2, "0");
    setRequirements([...requirements, { id: nextId, text: "" }]);
  };

  const removeReq = (id: string) => {
    if (requirements.length <= 1) return;
    setRequirements(requirements.filter((r) => r.id !== id).map((r, idx) => ({ ...r, id: String(idx + 1).padStart(2, "0") })));
  };

  const handleCreate = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!campaignName || !targetUrl || !adIdentity || !escrow) {
      alert("Fill all fields");
      return;
    }
    if (!targetUrl.startsWith("http")) {
      alert("URL must start with http");
      return;
    }

    try {
      setTxState("SIGNING");
      const client = getGenlayerClient();
      // @ts-ignore
      const account = await (window as any).ethereum.request({ method: "eth_requestAccounts" }).then((a: string[]) => a[0]);

      // Need wallet client for write
      const { createClient, custom } = await import("viem");
      const { privateKeyToAccount } = await import("viem/accounts");
      // Use window.ethereum as transport
      const walletClient = (await import("genlayer-js")).createClient({
        chain: {
          id: 61999,
          name: "GenLayer StudioNet",
          rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"] } },
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        } as any,
        transport: custom((window as any).ethereum) as any,
        account: account as any,
      } as any) as any;

      const requirementsJson = JSON.stringify(requirements);

      const wei = parseGenToWei(escrow);

      setTxState("SUBMITTED");

      // @ts-ignore genlayer-js writeContract signature
      const hash = await (walletClient as any).writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "create_agreement",
        args: [campaignName, targetUrl, adIdentity, requirementsJson, deadline],
        value: wei,
      });

      setTxHash(hash);
      setTxState("PENDING");

      // Wait for receipt
      // @ts-ignore
      const receipt = await (walletClient as any).waitForTransactionReceipt?.({ hash, status: "FINALIZED" }) || await new Promise((r) => setTimeout(r, 3000));

      setTxState("FINALIZING");

      // Try to get agreement count to infer id, or read recent
      const clientRead = getGenlayerClient();
      const count = (await (clientRead as any).readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: "get_agreement_count",
        args: [],
      })) as string;

      const newId = String(parseInt(count) - 1);
      setAgreementId(newId);
      setTxState("FINALIZED");

      setTimeout(() => router.push(`/campaigns/${newId}`), 1500);
    } catch (e: any) {
      console.error(e);
      setTxState("FAILED");
      alert(`Failed: ${e.message || e}`);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-[32px] font-bold">Create Placement Agreement</h1>
        <p className="text-[14px] text-[#6b6b6b] mt-1">Define visual requirements that GenLayer will evaluate against live publisher evidence.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Form */}
        <div className="col-span-7 space-y-6">
          <div className="border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-4">Campaign Details</h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Campaign name</label>
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#1a1a1a]" placeholder="Homepage Hero Placement" />
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Publisher URL (target)</label>
                <input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-3 py-2 text-[14px] font-mono focus:outline-none focus:border-[#1a1a1a]" placeholder="https://publisher.com" />
                <div className="text-[11px] text-[#6b6b6b] mt-1 font-mono">Live page that validators will render as screenshot evidence.</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Advertisement identity</label>
                  <input value={adIdentity} onChange={(e) => setAdIdentity(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#1a1a1a]" placeholder="ACME / Nike / Brand" />
                </div>
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Escrow amount (GEN)</label>
                  <input value={escrow} onChange={(e) => setEscrow(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-3 py-2 text-[14px] font-mono focus:outline-none focus:border-[#1a1a1a]" placeholder="0.2" />
                </div>
              </div>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#1a1a1a]" />
              </div>
            </div>
          </div>

          <div className="border border-[#e8e3db] bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-[11px] uppercase tracking-widest">Visual Requirements</h3>
              <button onClick={addReq} className="text-[11px] font-mono border border-[#e8e3db] px-2 py-1 hover:bg-[#f5f1e8]">+ Add criterion</button>
            </div>
            <div className="space-y-3">
              {requirements.map((req) => (
                <div key={req.id} className="flex gap-3 items-start border border-[#e8e3db] p-3 bg-[#fdfcf8]">
                  <span className="font-mono text-[11px] bg-[#1a1a1a] text-white px-1.5 py-0.5">{req.id}</span>
                  <input value={req.text} onChange={(e) => updateReq(req.id, e.target.value)} className="flex-1 bg-transparent text-[13px] focus:outline-none border-b border-transparent focus:border-[#1a1a1a]" placeholder="Requirement text" />
                  <button onClick={() => removeReq(req.id)} className="text-[11px] font-mono text-[#6b6b6b] hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[11px] font-mono text-[#6b6b6b] bg-[#f5f1e8] border border-[#e8e3db] p-2">
              Example: "Advertisement must be visible above the fold" • "Brand logo must be visible" • "No competitor adjacent"
            </div>
          </div>

          <div className="border border-[#e8e3db] bg-[#1a1a1a] text-white p-4">
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#9ca3af] mb-2">Transaction Lifecycle</div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              {["IDLE", "SIGNING", "SUBMITTED", "PENDING", "FINALIZING", "FINALIZED"].map((s, i) => (
                <span key={s} className={`${txState === s ? "text-white bg-[#2d2d2d] px-1.5 py-0.5" : "text-[#6b6b6b]"}`}>
                  {s}{i < 5 ? " →" : ""}
                </span>
              ))}
            </div>
            {txHash && <div className="mt-2 text-[10px] font-mono text-[#9ca3af] truncate">tx {txHash}</div>}
            {agreementId && <div className="mt-1 text-[10px] font-mono text-emerald-400">agreement #{agreementId} created</div>}
          </div>

          <button
            onClick={handleCreate}
            disabled={txState === "PENDING" || txState === "SIGNING"}
            className="w-full bg-[#1a1a1a] text-white font-mono text-[12px] uppercase tracking-widest py-3 hover:bg-[#2d2d2d] disabled:opacity-50 transition-colors"
          >
            {txState === "IDLE" ? "Create Agreement →" : txState}
          </button>
        </div>

        {/* Live Preview */}
        <div className="col-span-5">
          <div className="sticky top-[72px] border border-[#e8e3db] bg-white p-5">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-4">Live Agreement Preview</h3>
            <div className="bg-[#fdfcf8] border border-[#e8e3db] p-4 font-mono text-[11px] leading-relaxed">
              <div className="mb-3">
                <span className="text-[#6b6b6b]">CAMPAIGN</span>
                <div className="text-[14px] font-serif text-[#1a1a1a]">{campaignName || "—"}</div>
              </div>
              <div className="mb-3">
                <span className="text-[#6b6b6b]">TARGET URL</span>
                <div className="truncate text-[#4f46e5]">{targetUrl || "—"}</div>
              </div>
              <div className="mb-3">
                <span className="text-[#6b6b6b]">AD IDENTITY</span>
                <div>{adIdentity || "—"}</div>
              </div>
              <div className="mb-3">
                <span className="text-[#6b6b6b]">ESCROW</span>
                <div>{escrow} GEN</div>
              </div>
              <div className="mb-3">
                <span className="text-[#6b6b6b]">DEADLINE</span>
                <div>{deadline}</div>
              </div>
              <div>
                <span className="text-[#6b6b6b]">VISUAL REQUIREMENTS</span>
                <div className="mt-2 space-y-1.5">
                  {requirements.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      <span className="bg-[#1a1a1a] text-white px-1 text-[10px]">{r.id}</span>
                      <span className="text-[11px]">{r.text || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#f5f1e8] border border-[#e8e3db] p-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-1">What will be evaluated</div>
              <div className="text-[12px] leading-snug">
                GenLayer validators will render <span className="font-mono bg-white border px-1">{targetUrl}</span> as screenshot, then vision LLM will check each requirement. Result stored on-chain as COMPLIANT / NON_COMPLIANT / INCONCLUSIVE.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
