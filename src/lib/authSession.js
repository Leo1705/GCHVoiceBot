import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nora_session";

export function getAuthSecret() {
  const s = process.env.AUTH_SECRET;
  if (s && String(s).trim()) return String(s).trim();
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production");
  }
  return "dev-insecure-secret-change-me";
}

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signSessionToken(userId) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = payload.sub;
    return sub ? String(sub) : null;
  } catch {
    return null;
  }
}
