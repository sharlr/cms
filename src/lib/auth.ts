import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "cnl_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET manquant dans l'environnement.");
  return new TextEncoder().encode(value);
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Utilisateur courant, ou null si la session est absente/expirée. */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      city: true,
      gender: true,
      birthDate: true,
      educationLevel: true,
    },
  });
}

/**
 * Données de l'utilisateur affichées par la barre de navigation, compteur de
 * messages non lus compris. `null` pour un visiteur non connecté.
 */
export async function getNavUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return { fullName: user.fullName, role: user.role, unreadCount };
}
