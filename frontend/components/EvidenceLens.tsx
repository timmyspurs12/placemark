"use client";

import { useState } from "react";

interface CriteriaResult {
  id: string;
  text: string;
  result: "PASS" | "FAIL" | "INCONCLUSIVE";
  evidence: string;
}

interface EvidenceLensProps {
  targetUrl: string;
  decision: string;
  reason: string;
  criteria: CriteriaResult[];
  evidenceHash: string;
  timestamp?: string;
  status: string;
}

export default function EvidenceLens({ targetUrl, decision, reason, criteria, evidenceHash, timestamp, status }: EvidenceLensProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PLACEMENT" | "BRAND" | "CONTEXT" | "DECISION">("OVERVIEW");

  const passCount = criteria.filter(c => c.result === "PASS").length;
  const totalCount = criteria.length || 5;

  return (
    <div className="border border-[#e8e3db] bg-white">
      {/* Header */}
      <div className="border-b border-[#e8e3db] bg-[#fdfcf8] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#4f46e5] rounded-full" />
          <span className="font-mono text-[11px] uppercase tracking-widest">Evidence Lens</span>
          <span className="font-mono text-[10px] text-[#6b6b6b] border border-[#e8e3db] px-1.5 py-0.5">{status}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#6b6b6b]">
          <span>{targetUrl}</span>
          <span>•</span>
          <span>{timestamp || new Date().toISOString().slice(0,19)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e8e3db] bg-[#fdfcf8]">
        {(["OVERVIEW", "PLACEMENT", "BRAND", "CONTEXT", "DECISION"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest border-r border-[#e8e3db] transition-colors ${
              activeTab === tab ? "bg-[#1a1a1a] text-white" : "text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 min-h-[480px]">
        {/* Screenshot Area */}
        <div className="col-span-8 border-r border-[#e8e3db] bg-[#faf8f3] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b]">Live Page Capture</div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-white border border-[#e8e3db] px-2 py-1">viewport 1280x800</span>
              <span className="text-[10px] font-mono bg-white border border-[#e8e3db] px-2 py-1">hash {evidenceHash.slice(0,8) || "—"}</span>
            </div>
          </div>

          {/* Polaroid */}
          <div className="evidence-polaroid p-3 pb-12 relative">
            <div className="bg-[#f5f1e8] border border-[#e8e3db] aspect-[1280/800] w-full relative overflow-hidden">
              {/* Simulated webpage preview */}
              <div className="absolute inset-0 bg-white p-4">
                <div className="h-8 bg-[#f5f1e8] border border-[#e8e3db] mb-3 flex items-center px-3 gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-[10px] font-mono text-[#6b6b6b]">{targetUrl}</span>
                </div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8">
                    <div className="h-4 bg-[#1a1a1a] w-3/4 mb-2" />
                    <div className="h-3 bg-[#e8e3db] w-full mb-1" />
                    <div className="h-3 bg-[#e8e3db] w-5/6 mb-3" />
                    {/* Ad slot */}
                    <div className="border-2 border-dashed border-[#4f46e5] bg-[#eef0ff] p-3 relative">
                      <div className="absolute -top-2 -left-2 bg-[#4f46e5] text-white text-[9px] font-mono px-1.5 py-0.5">AD • 300x250</div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#1a1a1a] text-white flex items-center justify-center font-mono text-[10px]">ACME</div>
                        <div>
                          <div className="text-[12px] font-semibold">ACME Launch - $20 off</div>
                          <div className="text-[10px] text-[#6b6b6b]">Sponsored • acme.com/launch</div>
                        </div>
                      </div>
                      {decision === "COMPLIANT" && (
                        <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                      )}
                    </div>
                    <div className="mt-3 h-3 bg-[#e8e3db] w-full" />
                    <div className="mt-1 h-3 bg-[#e8e3db] w-4/6" />
                  </div>
                  <div className="col-span-4">
                    <div className="h-20 bg-[#f5f1e8] border border-[#e8e3db] mb-2" />
                    <div className="h-3 bg-[#e8e3db] w-full mb-1" />
                    <div className="h-3 bg-[#e8e3db] w-3/4" />
                  </div>
                </div>
                {/* Fold line */}
                <div className="absolute left-0 right-0 top-[320px] border-t border-dashed border-amber-500 flex items-center">
                  <span className="bg-amber-500 text-white text-[8px] font-mono px-1 ml-2">FOLD • 800px</span>
                </div>
              </div>

              {/* Markers overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {criteria.map((c, i) => (
                  <div key={c.id} className="absolute" style={{ top: `${12 + i * 14}%`, left: "8px" }}>
                    <span className={`text-[9px] font-mono px-1 py-0.5 border ${c.result === "PASS" ? "bg-emerald-50 border-emerald-600 text-emerald-700" : c.result === "FAIL" ? "bg-red-50 border-red-600 text-red-700" : "bg-amber-50 border-amber-600 text-amber-700"}`}>
                      {c.id} {c.result === "PASS" ? "✓" : c.result === "FAIL" ? "✕" : "?"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Polaroid footer */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6b6b6b]">CAPTURE {new Date().toLocaleString()} • GENLAYER VERIFIED</span>
              <span className={`evidence-stamp text-[10px] ${decision === "COMPLIANT" ? "stamp-compliant" : decision === "NON_COMPLIANT" ? "stamp-non" : "stamp-inconclusive"}`}>
                {decision || "PENDING"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-white border border-[#e8e3db] p-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b6b]">Viewport</div>
              <div className="text-[12px] font-mono">1280 × 800</div>
            </div>
            <div className="bg-white border border-[#e8e3db] p-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b6b]">Capture</div>
              <div className="text-[12px] font-mono">{timestamp?.slice(11,19) || "14:32:07"} UTC</div>
            </div>
            <div className="bg-white border border-[#e8e3db] p-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b6b]">Evidence</div>
              <div className="text-[12px] font-mono truncate">{evidenceHash || "a7f3c9e2"}</div>
            </div>
          </div>
        </div>

        {/* Criteria Panel */}
        <div className="col-span-4 bg-white">
          {activeTab === "OVERVIEW" && (
            <div className="p-5">
              <div className="mb-6">
                <div className={`evidence-stamp text-[13px] mb-3 ${decision === "COMPLIANT" ? "stamp-compliant" : decision === "NON_COMPLIANT" ? "stamp-non" : "stamp-inconclusive"}`}>
                  {decision || "PENDING"} {criteria.length > 0 && `${passCount} / ${totalCount}`}
                </div>
                <p className="text-[13px] leading-relaxed text-[#2d2d2d]">{reason || "Awaiting GenLayer evaluation. Live page will be captured and checked against predefined requirements."}</p>
              </div>

              <div className="space-y-3">
                {criteria.length > 0 ? criteria.map((c) => (
                  <div key={c.id} className="border border-[#e8e3db] p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] text-[#6b6b6b]">{c.id}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${c.result === "PASS" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : c.result === "FAIL" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                        {c.result}
                      </span>
                    </div>
                    <div className="text-[12px] leading-snug mb-1">{c.text}</div>
                    <div className="text-[11px] text-[#6b6b6b] font-mono leading-snug">{c.evidence}</div>
                  </div>
                )) : (
                  <div className="text-[12px] text-[#6b6b6b] font-mono">No evaluation yet. Trigger GenLayer evaluation to see criteria results.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "PLACEMENT" && (
            <div className="p-5">
              <h4 className="font-mono text-[11px] uppercase tracking-widest mb-3">Placement Checks</h4>
              <div className="space-y-2">
                {criteria.filter(c => c.text.toLowerCase().includes("fold") || c.text.toLowerCase().includes("content") || c.text.toLowerCase().includes("overlap")).map(c => (
                  <div key={c.id} className="flex gap-2 text-[12px]">
                    <span className={c.result === "PASS" ? "text-emerald-600" : "text-red-600"}>{c.result === "PASS" ? "✓" : "✕"}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
                {criteria.length === 0 && <div className="text-[12px] text-[#6b6b6b]">Above fold, main content, no overlap checks will appear here.</div>}
              </div>
            </div>
          )}

          {activeTab === "BRAND" && (
            <div className="p-5">
              <h4 className="font-mono text-[11px] uppercase tracking-widest mb-3">Brand Visibility</h4>
              <div className="space-y-2">
                {criteria.filter(c => c.text.toLowerCase().includes("logo") || c.text.toLowerCase().includes("brand")).map(c => (
                  <div key={c.id} className="flex gap-2 text-[12px]">
                    <span className={c.result === "PASS" ? "text-emerald-600" : "text-red-600"}>{c.result === "PASS" ? "✓" : "✕"}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
                {criteria.length === 0 && <div className="text-[12px] text-[#6b6b6b]">Logo and brand visibility checks will appear here.</div>}
              </div>
            </div>
          )}

          {activeTab === "CONTEXT" && (
            <div className="p-5">
              <h4 className="font-mono text-[11px] uppercase tracking-widest mb-3">Context & Safety</h4>
              <div className="space-y-2">
                {criteria.filter(c => c.text.toLowerCase().includes("competitor") || c.text.toLowerCase().includes("adjacent")).map(c => (
                  <div key={c.id} className="flex gap-2 text-[12px]">
                    <span className={c.result === "PASS" ? "text-emerald-600" : "text-red-600"}>{c.result === "PASS" ? "✓" : "✕"}</span>
                    <span>{c.text}</span>
                  </div>
                ))}
                {criteria.length === 0 && <div className="text-[12px] text-[#6b6b6b]">Competitor adjacency checks will appear here.</div>}
              </div>
            </div>
          )}

          {activeTab === "DECISION" && (
            <div className="p-5">
              <h4 className="font-mono text-[11px] uppercase tracking-widest mb-3">GenLayer Record</h4>
              <div className="space-y-3 text-[11px] font-mono">
                <div className="border border-[#e8e3db] p-2">
                  <div className="text-[#6b6b6b] uppercase text-[10px]">Decision</div>
                  <div className="text-[13px] font-semibold">{decision || "—"}</div>
                </div>
                <div className="border border-[#e8e3db] p-2">
                  <div className="text-[#6b6b6b] uppercase text-[10px]">Reason</div>
                  <div className="text-[12px] leading-snug">{reason || "—"}</div>
                </div>
                <div className="border border-[#e8e3db] p-2">
                  <div className="text-[#6b6b6b] uppercase text-[10px]">Evidence Hash</div>
                  <div className="truncate">{evidenceHash || "—"}</div>
                </div>
                <div className="border border-[#e8e3db] p-2">
                  <div className="text-[#6b6b6b] uppercase text-[10px]">Network</div>
                  <div>StudioNet 61999</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
