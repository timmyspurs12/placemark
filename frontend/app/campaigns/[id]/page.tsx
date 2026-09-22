"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getGenlayerClient, CONTRACT_ADDRESS, formatGen } from "@/lib/genlayer";
import EvidenceLens from "@/components/EvidenceLens";
import { useWallet } from "@/lib/wallet";

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { address, isConnected, connect } = useWallet();

  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [txState, setTxState] = useState<"IDLE" | "SIGNING" | "SUBMITTED" | "PENDING" | "EVALUATING" | "FINALIZING" | "FINALIZED" | "FAILED">("IDLE");
  const [txHash, setTxHash] = useState("");
  const [placementUrl, setPlacementUrl] = useState("");

  const fetchAgreement = async () => {
    try {
      const client = getGenlayerClient();
      const result = await (client as any).readContract({
        address: CONTRACT_ADDRESS as any,
        functionName: "get_agreement",
        args: [id],
      }) as string;
      const parsed = JSON.parse(result);
      setAgreement(parsed);
      if (!placementUrl && parsed.submitted_url) setPlacementUrl(parsed.submitted_url);
      if (!placementUrl && parsed.target_url) setPlacementUrl(parsed.target_url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreement();
    const interval = setInterval(fetchAgreement, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmitPlacement = async () => {
    if (!isConnected) { await connect(); return; }
    if (!placementUrl) { alert("Enter placement URL"); return; }
    try {
      setTxState("SIGNING");
      const { createClient, custom } = await import("viem");
      const walletClient = (await import("genlayer-js")).createClient({
        chain: { id: 61999, name: "GenLayer StudioNet", rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"] } }, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 } } as any,
        transport: custom((window as any).ethereum) as any,
        account: address as any,
      } as any) as any;
      setTxState("SUBMITTED");
      const hash = await (walletClient as any).writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "submit_placement",
        args: [id, placementUrl],
      });
      setTxHash(hash);
      setTxState("PENDING");
      await (walletClient as any).waitForTransactionReceipt?.({ hash, status: "FINALIZED" }) || await new Promise(r => setTimeout(r, 3000));
      setTxState("FINALIZED");
      fetchAgreement();
    } catch (e: any) {
      setTxState("FAILED");
      alert(e.message);
    }
  };

  const handleEvaluate = async () => {
    if (!isConnected) { await connect(); return; }
    try {
      setTxState("SIGNING");
      const { custom } = await import("viem");
      const walletClient = (await import("genlayer-js")).createClient({
        chain: { id: 61999, name: "GenLayer StudioNet", rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"] } }, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 } } as any,
        transport: custom((window as any).ethereum) as any,
        account: address as any,
      } as any) as any;
      setTxState("SUBMITTED");
      const hash = await (walletClient as any).writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "evaluate_placement",
        args: [id],
      });
      setTxHash(hash);
      setTxState("EVALUATING");
      // wait longer for nondet
      await (walletClient as any).waitForTransactionReceipt?.({ hash, status: "FINALIZED" }) || await new Promise(r => setTimeout(r, 15000));
      setTxState("FINALIZING");
      await new Promise(r => setTimeout(r, 2000));
      setTxState("FINALIZED");
      fetchAgreement();
    } catch (e: any) {
      setTxState("FAILED");
      alert(e.message);
    }
  };

  const handleFinalize = async () => {
    if (!isConnected) { await connect(); return; }
    try {
      setTxState("SIGNING");
      const { custom } = await import("viem");
      const walletClient = (await import("genlayer-js")).createClient({
        chain: { id: 61999, name: "GenLayer StudioNet", rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"] } }, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 } } as any,
        transport: custom((window as any).ethereum) as any,
        account: address as any,
      } as any) as any;
      setTxState("SUBMITTED");
      const hash = await (walletClient as any).writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "finalize_and_release",
        args: [id],
      });
      setTxHash(hash);
      setTxState("PENDING");
      await (walletClient as any).waitForTransactionReceipt?.({ hash, status: "FINALIZED" }) || await new Promise(r => setTimeout(r, 3000));
      setTxState("FINALIZED");
      fetchAgreement();
    } catch (e: any) {
      setTxState("FAILED");
      alert(e.message);
    }
  };

  if (loading) return <div className="max-w-[1280px] mx-auto px-6 py-8 font-mono text-[12px]">Loading agreement #{id} from GenLayer...</div>;
  if (!agreement) return <div className="max-w-[1280px] mx-auto px-6 py-8 font-mono text-[12px]">Agreement not found</div>;

  let criteria: any[] = [];
  try { criteria = JSON.parse(agreement.criteria_results_json || "[]"); } catch {}
  let requirements: any[] = [];
  try { requirements = JSON.parse(agreement.requirements_json || "[]"); } catch {}

  const passCount = criteria.filter((c: any) => c.result === "PASS").length;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[11px] bg-[#f5f1e8] border border-[#e8e3db] px-2 py-1">AGREEMENT #{agreement.agreement_id}</span>
            <span className={`font-mono text-[11px] px-2 py-1 border uppercase ${agreement.status === "COMPLIANT" ? "bg-emerald-50 border-emerald-600 text-emerald-700" : agreement.status === "NON_COMPLIANT" ? "bg-red-50 border-red-600 text-red-700" : "bg-white border-[#e8e3db] text-[#6b6b6b]"}`}>{agreement.status}</span>
            <span className="font-mono text-[11px] text-[#6b6b6b]">{formatGen(agreement.escrow_amount)} GEN escrow</span>
          </div>
          <h1 className="font-serif text-[28px] font-bold leading-tight">{agreement.campaign_name}</h1>
          <div className="font-mono text-[11px] text-[#6b6b6b] mt-1">Target: {agreement.target_url} • Brand: {agreement.ad_identity} • Deadline: {agreement.deadline}</div>
        </div>
        <div className="text-right">
          <div className={`evidence-stamp text-[14px] ${agreement.decision === "COMPLIANT" ? "stamp-compliant" : agreement.decision === "NON_COMPLIANT" ? "stamp-non" : "stamp-inconclusive"}`}>
            {agreement.decision === "NONE" ? "PENDING" : agreement.decision} {criteria.length > 0 ? `${passCount}/${criteria.length || requirements.length}` : ""}
          </div>
          <div className="font-mono text-[10px] text-[#6b6b6b] mt-2">GENLAYER RECORD<br />{agreement.evidence_hash?.slice(0,16) || "—"}<br />{agreement.created_at?.slice(0,19) || ""}</div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-6 gap-2 mb-6">
        {[
          { label: "Agreement", done: true },
          { label: "Placement Submitted", done: agreement.publisher_claimed },
          { label: "Capturing Page", done: txState === "EVALUATING" || agreement.decision !== "NONE" },
          { label: "Evaluating", done: agreement.decision !== "NONE" },
          { label: "Consensus", done: agreement.decision !== "NONE" },
          { label: "Finalized", done: agreement.settled },
        ].map((s, i) => (
          <div key={i} className={`border p-2 text-[10px] font-mono uppercase tracking-widest ${s.done ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#e8e3db] text-[#6b6b6b]"}`}>
            {String(i+1).padStart(2,"0")} {s.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <EvidenceLens
            targetUrl={agreement.submitted_url || agreement.target_url}
            decision={agreement.decision}
            reason={agreement.decision_reason}
            criteria={criteria.length > 0 ? criteria : requirements.map((r: any) => ({ id: r.id, text: r.text, result: "INCONCLUSIVE" as const, evidence: "Awaiting evaluation" }))}
            evidenceHash={agreement.evidence_hash}
            timestamp={agreement.created_at}
            status={agreement.status}
          />

          {/* Decision Page */}
          <div className="mt-6 border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-4">Decision</h3>
            <div className={`text-[28px] font-serif font-bold mb-2 ${agreement.decision === "COMPLIANT" ? "text-emerald-700" : agreement.decision === "NON_COMPLIANT" ? "text-red-700" : "text-amber-700"}`}>
              {agreement.decision === "NONE" ? "AWAITING EVALUATION" : agreement.decision}
            </div>
            {criteria.length > 0 && <div className="font-mono text-[11px] text-[#6b6b6b] mb-4">{passCount} / {criteria.length} requirements satisfied</div>}
            <div className="space-y-2">
              {criteria.map((c: any) => (
                <div key={c.id} className="flex gap-3 items-start border border-[#e8e3db] p-3">
                  <span className={`mt-0.5 w-5 h-5 flex items-center justify-center text-[11px] font-mono border ${c.result === "PASS" ? "bg-emerald-50 border-emerald-600 text-emerald-700" : c.result === "FAIL" ? "bg-red-50 border-red-600 text-red-700" : "bg-amber-50 border-amber-600 text-amber-700"}`}>
                    {c.result === "PASS" ? "✓" : c.result === "FAIL" ? "✕" : "?"}
                  </span>
                  <div>
                    <div className="text-[13px]">{c.text}</div>
                    <div className="text-[11px] font-mono text-[#6b6b6b]">{c.evidence}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#e8e3db] pt-4 grid grid-cols-2 gap-4 text-[11px] font-mono">
              <div className="border border-[#e8e3db] p-2">
                <div className="text-[#6b6b6b] uppercase text-[10px]">Contract</div>
                <div className="truncate">{process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</div>
              </div>
              <div className="border border-[#e8e3db] p-2">
                <div className="text-[#6b6b6b] uppercase text-[10px]">Transaction</div>
                <div className="truncate">{txHash || "—"}</div>
              </div>
              <div className="border border-[#e8e3db] p-2">
                <div className="text-[#6b6b6b] uppercase text-[10px]">Network</div>
                <div>StudioNet 61999</div>
              </div>
              <div className="border border-[#e8e3db] p-2">
                <div className="text-[#6b6b6b] uppercase text-[10px]">Finalized</div>
                <div>{agreement.created_at?.slice(0,19) || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="border border-[#e8e3db] bg-white p-4">
            <h4 className="font-mono text-[11px] uppercase tracking-widest mb-3">Actions</h4>
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b]">Placement URL</label>
                <input value={placementUrl} onChange={(e) => setPlacementUrl(e.target.value)} className="mt-1 w-full border border-[#e8e3db] px-2 py-1.5 text-[12px] font-mono" placeholder="https://publisher.com/page" />
              </div>
              <button onClick={handleSubmitPlacement} className="w-full border border-[#1a1a1a] text-[11px] font-mono uppercase tracking-widest py-2 hover:bg-[#f5f1e8]">Submit Placement</button>
              <button onClick={handleEvaluate} className="w-full bg-[#4f46e5] text-white text-[11px] font-mono uppercase tracking-widest py-2 hover:bg-[#4338ca]">Evaluate with GenLayer →</button>
              <button onClick={handleFinalize} disabled={!agreement.release_authorized && agreement.status !== "NON_COMPLIANT"} className="w-full bg-[#1a1a1a] text-white text-[11px] font-mono uppercase tracking-widest py-2 hover:bg-[#2d2d2d] disabled:opacity-40">Finalize & Release Escrow</button>
            </div>

            <div className="mt-4 border-t border-[#e8e3db] pt-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-2">Tx Lifecycle</div>
              <div className="flex flex-wrap gap-1">
                {["IDLE","SIGNING","SUBMITTED","PENDING","EVALUATING","FINALIZING","FINALIZED","FAILED"].map((s) => (
                  <span key={s} className={`text-[9px] font-mono px-1.5 py-0.5 border ${txState === s ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-[#e8e3db] text-[#6b6b6b]"}`}>{s}</span>
                ))}
              </div>
              {txHash && <div className="mt-2 text-[10px] font-mono truncate">hash: {txHash}</div>}
            </div>
          </div>

          <div className="border border-[#e8e3db] bg-[#fdfcf8] p-4">
            <h4 className="font-mono text-[11px] uppercase tracking-widest mb-2">Agreement</h4>
            <div className="space-y-2 text-[11px] font-mono">
              <div><span className="text-[#6b6b6b]">Advertiser:</span> <span className="truncate">{agreement.advertiser.slice(0,10)}...{agreement.advertiser.slice(-4)}</span></div>
              <div><span className="text-[#6b6b6b]">Publisher:</span> <span>{agreement.publisher ? `${agreement.publisher.slice(0,10)}...` : "—"}</span></div>
              <div><span className="text-[#6b6b6b]">Escrow:</span> {formatGen(agreement.escrow_amount)} GEN</div>
              <div><span className="text-[#6b6b6b]">Status:</span> {agreement.status}</div>
              <div><span className="text-[#6b6b6b]">Release authorized:</span> {agreement.release_authorized ? "YES" : "NO"}</div>
              <div><span className="text-[#6b6b6b]">Settled:</span> {agreement.settled ? "YES" : "NO"}</div>
            </div>
          </div>

          <div className="border border-[#e8e3db] bg-white p-4">
            <h4 className="font-mono text-[11px] uppercase tracking-widest mb-2">Requirements</h4>
            <div className="space-y-1.5">
              {requirements.map((r: any) => (
                <div key={r.id} className="flex gap-2 text-[11px]">
                  <span className="bg-[#1a1a1a] text-white px-1 text-[10px]">{r.id}</span>
                  <span>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
