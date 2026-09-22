"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGenlayerClient, CONTRACT_ADDRESS, parseAllAgreements } from "@/lib/genlayer";

export default function EvidencePage() {
  const [agreements, setAgreements] = useState<any[]>([]);

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
        setAgreements(parsed.filter((a: any) => a.decision !== "NONE"));
      } catch {}
    }
    fetchAll();
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <h1 className="font-serif text-[28px] font-bold mb-2">Evidence Archive</h1>
      <p className="text-[13px] text-[#6b6b6b] font-mono mb-8">Live webpage captures verified by GenLayer consensus • COMPLIANT / NON_COMPLIANT / INCONCLUSIVE</p>

      <div className="grid grid-cols-12 gap-4">
        {agreements.length === 0 ? (
          <div className="col-span-12 border border-dashed border-[#e8e3db] bg-white p-12 text-center font-mono text-[12px] text-[#6b6b6b]">No verified evidence yet. Create and evaluate a campaign.</div>
        ) : agreements.map((ag) => (
          <Link key={ag.agreement_id} href={`/campaigns/${ag.agreement_id}`} className="col-span-6 border border-[#e8e3db] bg-white p-4 hover:border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] bg-[#f5f1e8] border border-[#e8e3db] px-1.5 py-0.5">#{ag.agreement_id} • {ag.campaign_name}</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 border uppercase ${ag.decision === "COMPLIANT" ? "bg-emerald-50 border-emerald-600 text-emerald-700" : ag.decision === "NON_COMPLIANT" ? "bg-red-50 border-red-600 text-red-700" : "bg-amber-50 border-amber-600 text-amber-700"}`}>{ag.decision}</span>
            </div>
            <div className="font-mono text-[11px] text-[#6b6b6b] truncate">{ag.target_url}</div>
            <div className="mt-2 h-[120px] bg-[#fdfcf8] border border-[#e8e3db] p-2">
              <div className="h-2 bg-[#1a1a1a] w-2/3 mb-2" />
              <div className="border border-dashed border-[#4f46e5] bg-[#eef0ff] p-1.5 text-[10px]">AD • {ag.campaign_name.slice(0,20)}</div>
              <div className="mt-2 h-1.5 bg-[#e8e3db] w-full" />
              <div className="mt-1 h-1.5 bg-[#e8e3db] w-5/6" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
