# Placemark Deployment Guide

## Contract Deployment

### Option 1: GenLayer Studio UI (Recommended for hackathon)

1. Install GenLayer CLI: `npm install -g genlayer`
2. Init: `genlayer init --numValidators 3`
3. Start: `genlayer up`
4. Open Studio at http://localhost:8080
5. Upload `contracts/placemark.py`
6. Deploy – copy address
7. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local`

### Option 2: CLI

```bash
genlayer deploy --contract contracts/placemark.py
```

### Option 3: Script (for private key deploy)

```bash
cd deploy
npm install
PRIVATE_KEY=0x... GENLAYER_RPC=http://localhost:4000/api npx ts-node deployScript.ts
```

## Frontend Deployment

```bash
cd frontend
npm install
npm run build
npm run start
# or deploy to Vercel
vercel --prod
```

Set env vars in Vercel:
- NEXT_PUBLIC_CONTRACT_ADDRESS
- NEXT_PUBLIC_GENLAYER_RPC (https://studio.genlayer.com/api for Studionet)

## Demo Publisher

Demo publisher pages are served from:
- `/api/demo-publisher?variant=compliant` – shows ad above fold, logo visible
- `/api/demo-publisher?variant=noncompliant` – no ad
- `/api/demo-publisher?variant=belowfold` – ad below fold
- `/api/demo-publisher?variant=competitor` – ad adjacent to competitor
- `/api/demo-publisher?variant=nologo` – ad without logo

These are deterministic and can be used as target_url for GenLayer evaluation.

For StudioNet validators to fetch localhost, use `http://host.docker.internal:3000/api/demo-publisher?variant=compliant` as target_url when running Studio with Docker.

For public demo, deploy frontend to Vercel and use `https://your-vercel-url/api/demo-publisher?variant=compliant`

## Networks

- Local StudioNet: chain 61999, RPC http://localhost:4000/api, Explorer http://localhost:8080
- Hosted Studionet: chain 61999, RPC https://studio.genlayer.com/api, Explorer https://explorer-studio.genlayer.com/
- Testnet Asimov: chain 4221 (if available)

## Verification

After deployment, verify:
1. `get_agreement_count` returns >=0
2. Create agreement with 0.2 GEN payable
3. Submit placement URL
4. Evaluate – should show EVALUATING → COMPLIANT/NON_COMPLIANT with criteria results
5. Finalize – escrow release

All transaction hashes visible in explorer.

## LIVE DEPLOYMENT - 2026-09-22

Contract: 0xa79C6712154661086d7864FdA1BC09C705AF47E8
Explorer: https://explorer-studio.genlayer.com/address/0xa79C6712154661086d7864FdA1BC09C705AF47E8
Deploy Tx: 0x96384cfb169e0f20a6b352c9e401cfe23cec98889b963dad39e01929be2c032d
Creator: 0x17a7330dB952B29b69BA2DBc8ddf7e5049ad624f
Network: Studionet 61999
RPC: https://studio.genlayer.com/api
Status: FINALIZED, 1 transaction, Balance 0 GEN
File used: contracts/placemark_studio.py
