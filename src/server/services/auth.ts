import { compare, hash } from "bcryptjs";
import type { UserRole } from "@prisma/client";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function hashPlatformPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPlatformPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function createSessionPayload(user: SafeUser) {
  return {
    user,
    issuedAt: new Date().toISOString(),
    expiresIn: "7d",
    permissions:
      user.role === "ADMIN" || user.role === "SUPERADMIN"
        ? ["users:read", "orders:write", "assignments:write", "audit:read"]
        : ["profile:read", "orders:read", "orders:write"],
  };
}
