import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(__dirname, "..");
export const TOKEN_STORE_PATH = path.join(PROJECT_ROOT, ".upstox-token.json");

export const UPSTOX_API_BASE = "https://api.upstox.com/v2";
export const UPSTOX_AUTH_DIALOG_URL =
  "https://api.upstox.com/v2/login/authorization/dialog";
export const UPSTOX_TOKEN_URL =
  "https://api.upstox.com/v2/login/authorization/token";

export function getClientId(): string {
  const v = process.env.UPSTOX_API_KEY;
  if (!v) {
    throw new Error(
      "UPSTOX_API_KEY is not set. Create an app at https://developer.upstox.com and set UPSTOX_API_KEY/UPSTOX_API_SECRET/UPSTOX_REDIRECT_URI as environment variables."
    );
  }
  return v;
}

export function getClientSecret(): string {
  const v = process.env.UPSTOX_API_SECRET;
  if (!v) {
    throw new Error(
      "UPSTOX_API_SECRET is not set. Create an app at https://developer.upstox.com and set UPSTOX_API_KEY/UPSTOX_API_SECRET/UPSTOX_REDIRECT_URI as environment variables."
    );
  }
  return v;
}

export function getRedirectUri(): string {
  const v = process.env.UPSTOX_REDIRECT_URI;
  if (!v) {
    throw new Error(
      "UPSTOX_REDIRECT_URI is not set. It must exactly match the redirect URI configured on your Upstox app."
    );
  }
  return v;
}

interface StoredToken {
  access_token: string;
  obtained_at: string;
}

export function readStoredToken(): string | undefined {
  if (process.env.UPSTOX_ACCESS_TOKEN) {
    return process.env.UPSTOX_ACCESS_TOKEN;
  }
  try {
    const raw = fs.readFileSync(TOKEN_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoredToken;
    return parsed.access_token;
  } catch {
    return undefined;
  }
}

export function writeStoredToken(accessToken: string): void {
  const data: StoredToken = {
    access_token: accessToken,
    obtained_at: new Date().toISOString(),
  };
  fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(data, null, 2), {
    mode: 0o600,
  });
}
