// Uses Web Crypto (globalThis.crypto.subtle) rather than Node's `crypto`
// module, deliberately — this file is imported from middleware.ts, which
// runs on the Edge runtime and does not support Node's `crypto` module.

const COOKIE_NAME = "iv_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bufToHex(sig);
}

// Manual constant-time string compare — avoids depending on Node's crypto
// (not available on the Edge runtime) for the length-equal case.
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function issueSessionCookieValue(): Promise<string> {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${await hmac(issuedAt)}`;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const [issuedAt, sig] = cookieValue.split(".");
  if (!issuedAt || !sig) return false;
  const expected = await hmac(issuedAt);
  if (!timingSafeEqualStr(sig, expected)) return false;
  const age = (Date.now() - Number(issuedAt)) / 1000;
  return age >= 0 && age < MAX_AGE_SECONDS;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  return timingSafeEqualStr(input, expected);
}

export function checkSurveyToken(input: string): boolean {
  const expected = process.env.SURVEY_LINK_TOKEN || "";
  if (!expected) return false;
  return timingSafeEqualStr(input, expected);
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
