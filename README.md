# Placemark — Verifiable Ad Placement

> **"Where did your ad actually appear?"**

Placemark turns live publisher pages into verifiable placement evidence using GenLayer Intelligent Contracts.

## What it solves

Advertisers paying independent publishers ($100-$3k sponsorships) rely on manual screenshots that are trivially faked with inspect-element. Enterprise verification (DoubleVerify, IAS) costs $10k+/mo and requires publisher cooperation.

Placemark provides:
- Predefined visual agreement (publisher URL + 5 criteria + escrow)
- Live webpage capture as evidence (rendered inside GenLayer validators)
- Vision LLM evaluation of compliance
- Decentralized consensus on COMPLIANT / NON_COMPLIANT / INCONCLUSIVE
- On-chain escrow release authorized by decision

## Why visual ad verification is difficult

- "Above the fold" is visual, not textual
- Logo visibility requires image understanding
- Competitor adjacency requires contextual reasoning
- Evidence changes (publisher can remove ad after payment)
- Screenshots are easy to fake

## Why GenLayer is necessary

- Solidity cannot fetch web or see images
- Chainlink can fetch but cannot do vision-language judgment of "above fold" + "not near competitor"
- Centralized backend calling OpenAI = trusted single party
- GenLayer provides:
  - `gl.nondet.web.render(url, mode='screenshot')` → live screenshot as Image
  - `gl.nondet.exec_prompt(prompt, images=[screenshot])` → vision LLM inside contract
  - `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` → validators independently re-render and compare compliant boolean
  - `emit_transfer` → escrow settlement

This matches GenLayer's fit checklist: real on-chain consequence, judgment required, evidence independently checkable, benefits from neutral consensus.

## Architecture

```
Frontend (Next.js 15) 
  → genlayer-js → GenLayer StudioNet 61999
    → Placemark Intelligent Contract (Python)
      → leader: render screenshot + vision LLM
      → validators: re-render + re-evaluate + vote on decision
      → state: COMPLIANT / NON_COMPLIANT / INCONCLUSIVE + escrow
```

## Intelligent Contract

File: `contracts/placemark.py`

State:
- `counter: str`
- `agreements: TreeMap[str, Agreement]` dataclass with campaign_name, target_url, ad_identity, requirements_json, escrow_amount, status, decision, criteria_results_json, evidence_hash, etc.
- `balances: TreeMap[str, str]`
- `total_escrow_locked: str`

Methods:
- `@gl.public.write.payable create_agreement(campaign_name, target_url, ad_identity, requirements_json, deadline) -> id`
- `@gl.public.write submit_placement(agreement_id, placement_url)`
- `@gl.public.write evaluate_placement(agreement_id) -> JSON` **core intelligent**
- `@gl.public.write finalize_and_release(agreement_id)`
- `@gl.public.view get_agreement(id) -> JSON`
- `@gl.public.view get_all_agreements() -> JSON`

Evaluation flow:
```python
def leader_fn():
  screenshot = gl.nondet.web.render(eval_url, mode='screenshot')
  page_text = gl.nondet.web.render(eval_url, mode='text')
  prompt = f"Ad spec: {ad_spec} Requirements: {req_texts} Page text: {page_text}..."
  result = gl.nondet.exec_prompt(prompt, images=[screenshot])
  return json.dumps(result, sort_keys=True)

def validator_fn(leader_result):
  # re-run and compare decision boolean + 60% criteria match
  ...

result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

## Visual Evidence Pipeline

1. Advertiser creates agreement with target_url
2. Publisher claims placement
3. Anyone calls evaluate_placement
4. Leader renders live page as screenshot (authoritative evidence)
5. Leader also fetches text for grounding
6. Vision LLM evaluates each requirement → JSON {decision, confidence, reason, criteria: [{id, text, result: PASS/FAIL/INCONCLUSIVE, evidence}]}
7. Validators re-render independently, compare decision boolean
8. Consensus → status COMPLIANT/NON_COMPLIANT/INCONCLUSIVE stored on-chain
9. Finalize releases escrow via emit_transfer

## Escrow Workflow

- Simple, no tokens/NFTs/DAO
- create_agreement is payable, locks GEN
- COMPLIANT → release_authorized true → finalize sends to publisher
- NON_COMPLIANT → refund to advertiser
- INCONCLUSIVE → locked for manual review
- Uses `_Payee` interface with `emit_transfer(value=u256(amount))` verified pattern

## Local Setup

Prereqs: Node 18+, Python 3.10+

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_CONTRACT_ADDRESS after deployment
npm run dev
# http://localhost:3000
```

GenLayer Studio (requires Docker):
```bash
npm install -g genlayer
genlayer init --numValidators 3
genlayer up
# Studio at http://localhost:8080
# Deploy via Studio UI: upload contracts/placemark.py
# Or CLI: genlayer deploy --contract contracts/placemark.py
```

Deploy script:
```bash
cd deploy
npm install
PRIVATE_KEY=0x... GENLAYER_RPC=http://localhost:4000/api ts-node deployScript.ts
```

## Environment Variables

Frontend:
- `NEXT_PUBLIC_CONTRACT_ADDRESS` – deployed contract address
- `NEXT_PUBLIC_GENLAYER_RPC` – default http://localhost:4000/api

No secrets in frontend. Private key only for deploy script via env.

## Deployment

- Network: StudioNet 61999 (local) / Studionet chain 61999 (hosted)
- Contract address: set after deploy in .env.local
- Explorer: https://explorer-studio.genlayer.com/address/0x...

## Demo Instructions

Deterministic demo using public URLs + local demo publisher:

1. Deploy contract, set address in frontend .env.local
2. Run frontend: `npm run dev`
3. Create campaign:
   - Campaign: "Homepage Hero Placement"
   - Publisher URL: `https://example.com` (public, contains "Example Domain") OR `http://localhost:3000/api/demo-publisher?variant=compliant`
   - Ad identity: "ACME" or "Example Domain"
   - Requirements: default 5 (above fold, logo visible, main content, no overlap, no competitor)
   - Escrow: 0.2 GEN, Deadline: +7 days
4. Submit placement: same URL
5. Evaluate: triggers GenLayer transaction → PENDING → EVALUATING → FINALIZED
   - Leader renders screenshot, calls vision LLM, validators vote
6. See decision: COMPLIANT 5/5 → Evidence Lens shows markers
7. Finalize & Release: publisher withdraws

Failing condition demo:
- Create campaign with Publisher URL `https://example.com` but ad_identity "Nike" and requirement "Nike logo visible" → vision LLM will return NON_COMPLIANT (logo not found)
- Or use demo publisher variant `?variant=noncompliant` (no ad) → NON_COMPLIANT
- Variant `?variant=belowfold` → FAIL on above fold
- Variant `?variant=competitor` → FAIL on competitor adjacency

Transaction lifecycle visible: IDLE → SIGNING → SUBMITTED → PENDING → EVALUATING → FINALIZING → FINALIZED

## Testing

```bash
# Direct mode (mocked, no Studio needed)
pytest tests/direct/test_placemark.py -v

# Frontend build
cd frontend
npm run build
```

Tests cover:
- agreement creation validation
- requirements JSON validation
- URL validation
- decision parsing COMPLIANT/NON_COMPLIANT/INCONCLUSIVE
- criteria logic
- transaction lifecycle
- finalized state retrieval
- escrow state

## Known Limitations

- Anti-bot / Cloudflare may block render → INCONCLUSIVE with retry
- Screenshot is point-in-time, not continuous (future: daily cron verification)
- Publisher cloaking (serving ad only to validators) possible – mitigated by multiple checks
- Vision LLM variance on subjective "above fold" – strict prompt + boolean consensus
- Large screenshots increase gas/latency – limited to viewport

## Future Roadmap

- Daily automated re-verification for duration enforcement
- Publisher reputation score based on historical compliance
- Support for multiple ad slots per page
- IPFS storage of evidence screenshots with hash on-chain
- Integration with Substack / Ghost / WordPress plugins
- Paid verification marketplace for long-tail publishers

## Visual System: Evidence Lens

- Warm off-white #fdfcf8 foundation, graphite #1a1a1a typography, indigo #4f46e5 accent
- No neon, no glassmorphism, no giant rounded cards
- Signature component: Evidence Lens – split view LIVE PAGE + CRITERIA + DECISION with Polaroid screenshot, fold line, compliance stamp
- Tabs: OVERVIEW / PLACEMENT / BRAND / CONTEXT / DECISION
- Editorial spacing, restrained borders, mono for contract, serif for headings

## Statement

"Placemark can take a predefined advertising placement agreement, inspect a live publisher webpage as visual evidence, use a GenLayer Intelligent Contract to determine whether the placement satisfies the agreement, and record the resulting decision on-chain."

Built as complete working GenLayer app with real contract, real frontend, real transaction lifecycle, no mocked GenLayer decisions.
