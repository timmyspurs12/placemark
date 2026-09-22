"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGenlayerClient, CONTRACT_ADDRESS, parseAllAgreements, formatGen } from "@/lib/genlayer";

export default function LandingPage() {
  const [stats, setStats] = useState({ total: 0, compliant: 0, locked: "0" });

  useEffect(() => {
    async function fetchStats() {
      try {
        const client = getGenlayerClient();
        const count = await (client as any).readContract({
          address: CONTRACT_ADDRESS as any,
          functionName: "get_agreement_count",
          args: [],
        }) as string;
        const all = await (client as any).readContract({
          address: CONTRACT_ADDRESS as any,
          functionName: "get_all_agreements",
          args: [],
        }) as string;
        const agreements = parseAllAgreements(all);
        const compliant = agreements.filter((a: any) => a.decision === "COMPLIANT").length;
        // Calculate total locked from agreements (studio contract doesn't have get_total_locked)
        let totalLocked = "0";
        try {
          totalLocked = agreements.reduce((sum: bigint, a: any) => {
            try { return sum + BigInt(a.escrow_amount || "0"); } catch { return sum; }
          }, BigInt(0)).toString();
        } catch {}
        setStats({ total: parseInt(count) || agreements.length, compliant, locked: totalLocked });
      } catch (e) {
        console.log("stats fetch error", e);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <div className="inline-flex items-center gap-2 border border-[#e8e3db] bg-white px-2.5 py-1 mb-6">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Live verification • GenLayer consensus</span>
            </div>
            <h1 className="font-serif text-[56px] leading-[0.95] tracking-tight font-bold mb-6">
              WHERE DID YOUR AD<br />
              ACTUALLY APPEAR?
            </h1>
            <p className="text-[18px] leading-relaxed text-[#2d2d2d] max-w-[520px] mb-8">
              Placemark turns live publisher pages into verifiable placement evidence. Define visual requirements. Capture live proof. Let GenLayer decide.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/create" className="bg-[#1a1a1a] text-white font-mono text-[12px] uppercase tracking-widest px-6 py-3 hover:bg-[#2d2d2d] transition-colors">
                Create placement →
              </Link>
              <Link href="/campaigns" className="border border-[#1a1a1a] text-[#1a1a1a] font-mono text-[12px] uppercase tracking-widest px-6 py-3 hover:bg-[#f5f1e8] transition-colors">
                View verified placements
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#e8e3db] pt-6 max-w-[480px]">
              <div>
                <div className="font-mono text-[24px] font-bold">{stats.total}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b]">Agreements</div>
              </div>
              <div>
                <div className="font-mono text-[24px] font-bold">{stats.compliant}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b]">Compliant</div>
              </div>
              <div>
                <div className="font-mono text-[24px] font-bold">{formatGen(stats.locked)}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b]">GEN Locked</div>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            {/* Hero visual – Evidence composition */}
            <div className="border border-[#e8e3db] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] uppercase tracking-widest">Evidence Composition</span>
                <span className="font-mono text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5">COMPLIANT 5/5</span>
              </div>

              <div className="bg-[#fdfcf8] border border-[#e8e3db] p-3">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-[#6b6b6b]">
                  <span>techblog.example.com</span>
                  <span>•</span>
                  <span>1280×800</span>
                  <span>•</span>
                  <span>14:32:07 UTC</span>
                </div>

                <div className="bg-white border border-[#e8e3db] p-2">
                  <div className="h-3 bg-[#1a1a1a] w-2/3 mb-2" />
                  <div className="border-2 border-[#4f46e5] bg-[#eef0ff] p-2 relative mb-2">
                    <div className="absolute -top-1.5 -left-1.5 bg-[#4f46e5] text-white text-[8px] font-mono px-1">AD</div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center text-[8px] font-mono">ACME</div>
                      <div className="text-[10px]">ACME Launch — $20 off</div>
                    </div>
                    <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center text-white text-[8px]">✓</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-[#e8e3db] w-full" />
                    <div className="h-2 bg-[#e8e3db] w-5/6" />
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {[
                    { id: "01", text: "Above fold", ok: true },
                    { id: "02", text: "Logo visible", ok: true },
                    { id: "03", text: "Main content", ok: true },
                    { id: "04", text: "No overlap", ok: true },
                    { id: "05", text: "No competitor", ok: true },
                  ].map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[10px] font-mono border border-[#e8e3db] bg-white px-2 py-1">
                      <span className="text-[#6b6b6b]">{c.id}</span>
                      <span>{c.text}</span>
                      <span className={c.ok ? "text-emerald-600" : "text-red-600"}>{c.ok ? "✓" : "✕"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#6b6b6b]">GENLAYER RECORD • 0x8f3a…c9e2 • FINALIZED</span>
                <span className="evidence-stamp stamp-compliant text-[9px]">COMPLIANT</span>
              </div>
            </div>

            <div className="mt-4 border border-[#e8e3db] bg-[#1a1a1a] text-white p-3 font-mono text-[11px]">
              <div className="text-[#9ca3af] uppercase text-[10px] tracking-widest mb-2">Workflow</div>
              <div className="space-y-1">
                <div>PREDEFINED AGREEMENT →</div>
                <div className="text-[#9ca3af]">LIVE WEBPAGE EVIDENCE →</div>
                <div className="text-[#9ca3af]">GENLAYER VISUAL EVALUATION →</div>
                <div>CONSENSUS → ON-CHAIN DECISION → ESCROW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-y border-[#e8e3db] bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-4 gap-8">
          {[
            { n: "01", title: "Define Agreement", desc: "Publisher URL, brand identity, 5 visual criteria, escrow, deadline." },
            { n: "02", title: "Capture Live Page", desc: "GenLayer validators render the publisher page as screenshot evidence." },
            { n: "03", title: "Visual Evaluation", desc: "Vision LLM checks each criterion against live evidence with consensus." },
            { n: "04", title: "On-Chain Decision", desc: "COMPLIANT / NON_COMPLIANT / INCONCLUSIVE → escrow release authorized." },
          ].map((s) => (
            <div key={s.n} className="border-l border-[#e8e3db] pl-4">
              <div className="font-mono text-[11px] text-[#6b6b6b] mb-2">{s.n}</div>
              <div className="font-serif text-[16px] font-semibold mb-1">{s.title}</div>
              <div className="text-[13px] text-[#6b6b6b] leading-snug">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust problem */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-5">
            <h2 className="font-serif text-[28px] leading-tight font-bold mb-4">Screenshots lie.<br />Live pages don't.</h2>
            <p className="text-[14px] leading-relaxed text-[#2d2d2d] mb-4">
              Today, ad placement verification is manual screenshots that are trivially faked with inspect-element. Enterprise tools cost $10k/mo and require publisher cooperation.
            </p>
            <p className="text-[14px] leading-relaxed text-[#6b6b6b]">
              Placemark captures the publisher page inside GenLayer consensus. Validators independently render and evaluate. No single party controls evidence.
            </p>
          </div>
          <div className="col-span-7 grid grid-cols-2 gap-4">
            <div className="border border-[#e8e3db] bg-white p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-2">Before Placemark</div>
              <ul className="space-y-2 text-[12px] font-mono">
                <li className="flex gap-2"><span className="text-red-600">✕</span> Manual screenshots</li>
                <li className="flex gap-2"><span className="text-red-600">✕</span> Email disputes</li>
                <li className="flex gap-2"><span className="text-red-600">✕</span> No neutral judge</li>
                <li className="flex gap-2"><span className="text-red-600">✕</span> Funds stuck</li>
              </ul>
            </div>
            <div className="border border-[#1a1a1a] bg-[#1a1a1a] text-white p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2">With Placemark</div>
              <ul className="space-y-2 text-[12px] font-mono">
                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Live screenshot evidence</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Vision LLM evaluation</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span> Decentralized consensus</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span> On-chain escrow release</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
