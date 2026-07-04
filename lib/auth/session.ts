import type { UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "ps_shop_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export interface SessionPayload {
  v: 1;
  user_id: string;
  shop_id: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface CreateSessionInput {
  user_id: string;
  shop_id: string;
  role: UserRole;
}

function getSessionSecret() {
  const secret =
    process.env.AUTH_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing AUTH_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY for session signing"
    );
  }

  return secret;
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlEncodeText(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

async function createSignature(value: string) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(value)
  );

  return base64UrlEncodeBytes(new Uint8Array(signature));
}

export async function createSessionCookieValue(input: CreateSessionInput) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 1,
    user_id: input.user_id,
    shop_id: input.shop_id,
    role: input.role,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await createSignature(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function base64UrlDecodeText(value: string) {
  let base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function verifySessionCookieValue(
  cookieValue: string
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  try {
    const expectedSignature = await createSignature(encodedPayload);
    if (expectedSignature !== signature) {
      return null;
    }

    const decodedPayloadText = base64UrlDecodeText(encodedPayload);
    const payload = JSON.parse(decodedPayloadText) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

