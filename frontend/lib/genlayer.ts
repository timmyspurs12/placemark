"use client";

import { createClient, createAccount } from "genlayer-js";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Contract address will be set via env
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// GenLayer Studio localnet config
export const genlayerChain = {
  id: 61999,
  name: "GenLayer StudioNet",
  network: "genlayer-studionet",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api"],
    },
  },
} as const;

export function getGenlayerClient() {
  const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC || "http://localhost:4000/api";
  return createClient({
    chain: genlayerChain as any,
    transport: http(rpcUrl),
  } as any) as any;
}

// For frontend with MetaMask, we use window.ethereum
export async function getWalletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No wallet found");
  }
  const client = createClient({
    chain: genlayerChain as any,
    transport: (window as any).ethereum ? { request: (window as any).ethereum.request.bind((window as any).ethereum) } as any : http(genlayerChain.rpcUrls.default.http[0]),
  } as any) as any;
  return client;
}

// Helper to parse agreement from contract JSON string
export function parseAgreement(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function parseAllAgreements(jsonStr: string) {
  try {
    const arr = JSON.parse(jsonStr);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Requirements helpers
export interface Requirement {
  id: string;
  text: string;
}

export const DEFAULT_REQUIREMENTS: Requirement[] = [
  { id: "01", text: "Advertisement visible above the fold" },
  { id: "02", text: "Brand logo visible" },
  { id: "03", text: "Advertisement inside main content region" },
  { id: "04", text: "No overlapping advertisement" },
  { id: "05", text: "No adjacent competitor advertisement" },
];

export function formatGen(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    const gen = Number(wei) / 1e18;
    return gen.toFixed(4);
  } catch {
    return "0.0000";
  }
}

export function parseGenToWei(genStr: string): bigint {
  try {
    const gen = parseFloat(genStr);
    if (isNaN(gen) || gen <= 0) return BigInt(0);
    return BigInt(Math.floor(gen * 1e18));
  } catch {
    return BigInt(0);
  }
}
