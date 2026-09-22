export default function HowPage() {
  return (
    <div className="max-w-[960px] mx-auto px-6 py-12">
      <h1 className="font-serif text-[36px] font-bold leading-tight mb-6">How Placemark works</h1>
      
      <div className="border border-[#e8e3db] bg-white p-8 mb-8">
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#6b6b6b] mb-4">Core Principle</div>
        <div className="font-serif text-[18px] leading-relaxed">
          PREDEFINED VISUAL AGREEMENT → LIVE WEBPAGE EVIDENCE → GENLAYER VISUAL EVALUATION → CONSENSUS → ON-CHAIN DECISION → ESCROW CONSEQUENCE
        </div>
        <div className="mt-4 text-[13px] text-[#6b6b6b] leading-relaxed">
          GenLayer must be central. We do not fake evaluation. The screenshot is captured inside the Intelligent Contract via <span className="font-mono bg-[#f5f1e8] border border-[#e8e3db] px-1">gl.nondet.web.render(mode='screenshot')</span> and evaluated with <span className="font-mono bg-[#f5f1e8] border border-[#e8e3db] px-1">gl.nondet.exec_prompt(images=[screenshot])</span> under validator consensus.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7 space-y-6">
          <section className="border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-3">01 • Agreement</h3>
            <p className="text-[14px] leading-relaxed">Advertiser defines campaign: target publisher URL, brand identity (e.g., ACME), 5 visual criteria (above fold, logo visible, main content, no overlap, no competitor), escrow amount, deadline. Stored on-chain in TreeMap.</p>
          </section>
          <section className="border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-3">02 • Live Evidence</h3>
            <p className="text-[14px] leading-relaxed">Publisher submits placement URL. Anyone can trigger evaluation. Contract's leader_fn renders live page via <span className="font-mono text-[12px] bg-[#f5f1e8] px-1">gl.nondet.web.render(url, mode='screenshot')</span> returning Image, plus text mode for grounding. This is authoritative evidence – what any visitor sees.</p>
          </section>
          <section className="border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-3">03 • Visual Evaluation</h3>
            <p className="text-[14px] leading-relaxed">Leader calls <span className="font-mono text-[12px] bg-[#f5f1e8] px-1">gl.nondet.exec_prompt(prompt, images=[screenshot])</span> with structured prompt returning JSON {"{decision, criteria, reason}"}. Validator re-renders same URL independently and re-evaluates, votes true only if decision boolean matches. Uses <span className="font-mono text-[12px] bg-[#f5f1e8] px-1">gl.vm.run_nondet_unsafe(leader_fn, validator_fn)</span>.</p>
          </section>
          <section className="border border-[#e8e3db] bg-white p-6">
            <h3 className="font-mono text-[11px] uppercase tracking-widest mb-3">04 • Decision & Escrow</h3>
            <p className="text-[14px] leading-relaxed">Decision COMPLIANT → release_authorized true, escrow claimable by publisher via <span className="font-mono text-[12px] bg-[#f5f1e8] px-1">emit_transfer</span>. NON_COMPLIANT → refund to advertiser. INCONCLUSIVE → escrow locked for manual review. State transition stored durably.</p>
          </section>
        </div>

        <div className="col-span-5 space-y-4">
          <div className="border border-[#1a1a1a] bg-[#1a1a1a] text-white p-5">
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#9ca3af] mb-3">Why GenLayer is necessary</div>
            <ul className="space-y-2 text-[13px] font-mono leading-snug">
              <li>• Solidity cannot fetch web or see images</li>
              <li>• Chainlink can fetch but not vision-judge "above fold"</li>
              <li>• Centralized backend calling OpenAI = trusted party</li>
              <li>• GenLayer provides decentralized consensus over visual judgment</li>
            </ul>
          </div>

          <div className="border border-[#e8e3db] bg-white p-5">
            <div className="font-mono text-[11px] uppercase tracking-widest mb-3">Contract</div>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between"><span className="text-[#6b6b6b]">File</span><span>placemark.py</span></div>
              <div className="flex justify-between"><span className="text-[#6b6b6b]">State</span><span>TreeMap, u256</span></div>
              <div className="flex justify-between"><span className="text-[#6b6b6b]">Payable</span><span>create_agreement</span></div>
              <div className="flex justify-between"><span className="text-[#6b6b6b]">Nondet</span><span>render + exec_prompt</span></div>
              <div className="flex justify-between"><span className="text-[#6b6b6b]">Consensus</span><span>run_nondet_unsafe</span></div>
              <div className="flex justify-between"><span className="text-[#6b6b6b]">Transfer</span><span>emit_transfer</span></div>
            </div>
          </div>

          <div className="border border-[#e8e3db] bg-[#fdfcf8] p-5">
            <div className="font-mono text-[11px] uppercase tracking-widest mb-2">Known Limitations</div>
            <ul className="text-[12px] leading-relaxed list-disc pl-4 text-[#6b6b6b]">
              <li>Anti-bot / Cloudflare may block render → INCONCLUSIVE with retry</li>
              <li>Screenshot is point-in-time, not continuous monitoring (future: daily cron)</li>
              <li>Publisher cloaking possible – mitigated by multiple checks</li>
              <li>Vision LLM variance on subjective "above fold" – strict prompt + boolean consensus</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
