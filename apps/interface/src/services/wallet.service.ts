/**
 * Wallet service — pure business logic for wallet session and signing.
 * No React, no UI imports. Safe to use in tests and server contexts.
 */

import { NETWORK_PASSPHRASE } from "@/lib/constants";

export const SESSION_KEY = "fmc:wallet_address";
export const SESSION_WALLET_KEY = "fmc:wallet_type";

export type WalletType = "freighter" | "lobstr";

// ── Session ───────────────────────────────────────────────────────────────────

export function saveSession(address: string, walletType: WalletType): void {
  sessionStorage.setItem(SESSION_KEY, address);
  sessionStorage.setItem(SESSION_WALLET_KEY, walletType);
}

export function loadSession(): {
  address: string;
  walletType: WalletType;
} | null {
  const address = sessionStorage.getItem(SESSION_KEY);
  if (!address) return null;
  const walletType = (sessionStorage.getItem(SESSION_WALLET_KEY) ??
    "freighter") as WalletType;
  return { address, walletType };
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_WALLET_KEY);
}

// ── Network ───────────────────────────────────────────────────────────────────

export function isNetworkMatch(networkPassphrase: string): boolean {
  return networkPassphrase === NETWORK_PASSPHRASE;
}

// ── Sign error classification ─────────────────────────────────────────────────

export type SignErrorKind = "cancelled" | "network" | "unknown";

export function classifySignError(err: unknown): SignErrorKind {
  const msg = err instanceof Error ? err.message : "";
  if (/declined|rejected|cancel|denied/i.test(msg)) return "cancelled";
  if (/network|fetch|timeout|connection/i.test(msg)) return "network";
  return "unknown";
}
