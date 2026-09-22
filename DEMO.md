# Placemark Demo Script (60-120 seconds)

## Setup

- Contract deployed at: `0x...` (set in .env.local)
- Frontend running at http://localhost:3000
- Demo publisher at http://localhost:3000/api/demo-publisher

## 00:00–00:15 Hook

"Where did your ad actually appear? Today advertisers rely on fakeable screenshots. Placemark turns live publisher pages into verifiable evidence using GenLayer."

Show landing page with Evidence Lens composition.

## 00:15–00:30 Create Agreement

Click "Create placement" → Fill form:
- Campaign: "Homepage Hero Placement"
- Publisher URL: `https://example.com` or `http://host.docker.internal:3000/api/demo-publisher?variant=compliant`
- Ad identity: "ACME"
- Escrow: 0.2 GEN
- Requirements: default 5

Click Create Agreement → Show transaction lifecycle IDLE → SIGNING → SUBMITTED → PENDING → FINALIZED, tx hash, agreement #0 created.

## 00:30–00:45 Submit Placement

Go to campaign detail /campaigns/0 → Shows Agreement #0, status CREATED, escrow 0.2 GEN, requirements list.

Enter Placement URL same as target, click Submit Placement → tx PENDING → FINALIZED, status becomes PLACEMENT_SUBMITTED, publisher claimed true.

## 00:45–01:00 GenLayer Evaluation (Core)

Click "Evaluate with GenLayer →"

Show deliberate sequence:
1. CAPTURING PAGE – leader rendering screenshot via gl.nondet.web.render(mode='screenshot')
2. COLLECTING VISUAL EVIDENCE – also text mode
3. EVALUATING REQUIREMENTS – vision LLM exec_prompt with images
4. GENLAYER CONSENSUS – validators re-render independently, compare compliant boolean via run_nondet_unsafe
5. FINALIZING DECISION

Transaction goes EVALUATING (takes ~15s for LLM + consensus).

## 01:00–01:30 Decision

Receipt finalized → Evidence Lens shows:
- Polaroid screenshot with markers
- COMPLIANT 5/5 stamp
- Criteria: Above fold ✓, Logo ✓, Main content ✓, No overlap ✓, No competitor ✓
- Reason: "Banner found top-right, 300x250, red ACME logo visible above fold"
- GenLayer Record: contract address, tx hash, network, timestamp

## 01:30–02:00 Consequence

Click "Finalize & Release Escrow" → tx shows release authorized → publisher balance increases, escrow 0 GEN locked, status SETTLED.

Then demonstrate failing case:
- Create new campaign with variant=noncompliant (no ad)
- Evaluate → NON_COMPLIANT 0/5, failed requirements clearly identified: "Advertisement not visible above fold"
- Finalize → refund to advertiser

End with statement: "Placemark can take a predefined advertising placement agreement, inspect a live publisher webpage as visual evidence, use a GenLayer Intelligent Contract to determine whether the placement satisfies the agreement, and record the resulting decision on-chain."

## Reproducible

All variants deterministic:
- compliant → COMPLIANT
- noncompliant → NON_COMPLIANT
- belowfold → NON_COMPLIANT (above fold FAIL)
- competitor → NON_COMPLIANT (competitor check FAIL)
- nologo → NON_COMPLIANT (logo FAIL)
