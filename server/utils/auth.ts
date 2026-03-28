import { H3Event, createError, getCookie, setCookie, deleteCookie } from "h3";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { useDB } from "../database";
import {
  users,
  sessions,
  userGroups,
  groupPermissions,
  permissions,
} from "../database/schema";
import type { SessionUser } from "~/types";

const SESSION_COOKIE = "bw_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  event: H3Event,
  userId: string,
): Promise<void> {
  const db = useDB();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    const db = useDB();
    const tokenHash = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export async function getSessionUser(
  event: H3Event,
): Promise<SessionUser | null> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;

  const db = useDB();
  const tokenHash = hashToken(token);

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.tokenHash, tokenHash),
      gt(sessions.expiresAt, new Date()),
    ),
  });

  if (!session) return null;

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, session.userId), isNull(users.deletedAt)),
  });

  if (!user || !user.isActive) return null;

  // Load permissions through groups
  const userGroupRows = await db.query.userGroups.findMany({
    where: eq(userGroups.userId, user.id),
    with: {
      group: {
        with: {
          groupPermissions: {
            with: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  for (const ug of userGroupRows) {
    for (const gp of ug.group.groupPermissions) {
      permissionSet.add(gp.permission.codename);
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperuser: user.isSuperuser,
    permissions: Array.from(permissionSet),
  };
}

export async function requireAuth(event: H3Event): Promise<SessionUser> {
  const user = event.context.user as SessionUser | null;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  return user;
}

export function requirePermission(user: SessionUser, permission: string): void {
  if (user.isSuperuser) return;
  if (!user.permissions.includes(permission)) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }
}

export function requireSuperuser(user: SessionUser): void {
  if (!user.isSuperuser) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }
}

export async function hashPassword(password: string): Promise<string> {
  const config = useRuntimeConfig();
  return bcrypt.hash(password, config.bcryptRounds);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
