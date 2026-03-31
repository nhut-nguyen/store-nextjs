import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";

const SESSION_COOKIE = "gearhub-session";
const DEFAULT_SECRET = "gearhub-dev-secret";

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? DEFAULT_SECRET;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeUser(user: SessionUser) {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

function decodeUser(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionUser;
}

export function createSessionValue(user: SessionUser) {
  const payload = encodeUser(user);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const isValid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!isValid) {
    return null;
  }

  try {
    return decodeUser(payload);
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
