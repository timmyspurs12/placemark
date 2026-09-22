import { createClient } from "genlayer-js";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";
import path from "path";

const CONTRACT_PATH = path.join(__dirname, "../contracts/placemark.py");

async function main() {
  const rpcUrl = process.env.GENLAYER_RPC || "http://localhost:4000/api";
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    console.log("No PRIVATE_KEY, using local Studio deployment via genlayer CLI is recommended");
    console.log("Run: genlayer deploy --contract contracts/placemark.py");
    return;
  }

  const account = privateKeyToAccount(privateKey);
  const client = createClient({
    chain: {
      id: 61999,
      name: "GenLayer StudioNet",
      rpcUrls: { default: { http: [rpcUrl] } },
      nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
    } as any,
    transport: http(rpcUrl),
    account,
  });

  const code = fs.readFileSync(CONTRACT_PATH, "utf-8");

  console.log("Deploying Placemark contract...");
  console.log("RPC:", rpcUrl);
  console.log("Deployer:", account.address);

  // @ts-ignore
  const hash = await (client as any).deployContract({
    code,
    args: [],
  });

  console.log("Deploy tx hash:", hash);

  // @ts-ignore
  const receipt = await (client as any).waitForTransactionReceipt({ hash, status: "FINALIZED" });
  console.log("Deployed at:", receipt.contractAddress);
  console.log("Set NEXT_PUBLIC_CONTRACT_ADDRESS to this address");
}

main().catch(console.error);
