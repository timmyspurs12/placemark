"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGenlayerClient, CONTRACT_ADDRESS, parseAllAgreements, formatGen } from "@/lib/genlayer";

export default function CampaignsPage() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const client = getGenlayerClient();
        const all = await (client as any).readContract({
          address: CONTRACT_ADDRESS as any,
          functionName: "get_all_agreements",
          args: [],
        }) as string;
        const parsed = parseAllAgreements(all);
        setAgreements(parsed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-[28px] font-bold">Campaigns</h1>
          <p className="text-[13px] text-[#6b6b6b] font-mono mt-1">{agreements.length} agreements • live from GenLayer contract</p>
        </div>
        <Link href="/create" className="bg-[#1a1a1a] text-white font-mono text-[11px] uppercase tracking-widest px-4 py-2 hover:bg-[#2d2d2d]">Create →</Link>
      </div>

      {loading ? (
        <div className="font-mono text-[12px] text-[#6b6b6b]">Loading from contract...</div>
      ) : agreements.length === 0 ? (
        <div className="border border-dashed border-[#e8e3db] bg-white p-12 text-center">
          <div className="font-mono text-[12px] text-[#6b6b6b]">No campaigns yet. Create the first placement agreement.</div>
          <Link href="/create" className="mt-4 inline-block border border-[#1a1a1a] px-4 py-2 font-mono text-[11px] uppercase tracking-widest">Create placement</Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {agreements.map((ag) => (
            <Link key={ag.agreement_id} href={`/campaigns/${ag.agreement_id}`} className="col-span-4 border border-[#e8e3db] bg-white hover:border-[#1a1a1a] transition-colors p-4 group">
              <div className="flex items-start justify-between mb-3">
                <div className="font-mono text-[10px] bg-[#f5f1e8] border border-[#e8e3db] px-1.5 py-0.5">#{ag.agreement_id}</div>
                <div className={`font-mono text-[10px] px-1.5 py-0.5 border uppercase ${ag.status === "COMPLIANT" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ag.status === "NON_COMPLIANT" ? "bg-red-50 border-red-200 text-red-700" : ag.status === "SETTLED" ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                  {ag.status}
                </div>
              </div>
              <div className="font-serif text-[16px] font-semibold leading-tight mb-1 group-hover:underline">{ag.campaign_name}</div>
              <div className="font-mono text-[11px] text-[#6b6b6b] truncate mb-3">{ag.target_url}</div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6b6b6b]">{formatGen(ag.escrow_amount)} GEN</span>
                <span className={`px-1.5 py-0.5 border text-[10px] ${ag.decision === "COMPLIANT" ? "border-emerald-600 text-emerald-700 bg-emerald-50" : ag.decision === "NON_COMPLIANT" ? "border-red-600 text-red-700 bg-red-50" : "border-[#e8e3db] text-[#6b6b6b]"}`}>
                  {ag.decision || "NONE"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
