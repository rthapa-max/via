import { jwtVerify, SignJWT } from "jose";

// Bump this when auth schema changes to invalidate old sessions.
const COOKIE_NAME = "wc_session_v2";

export function getSessionCookieName() {
  return COOKIE_NAME;
}

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("Missing AUTH_JWT_SECRET");
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
};

export async function signSession(user: SessionUser) {
  const secret = getJwtSecret();
  return await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionUser> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  const id = payload.sub;
  const email = payload.email;
  if (!id || typeof email !== "string") throw new Error("Invalid session");
  return { id, email };
}

