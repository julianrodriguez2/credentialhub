import { jwtVerify } from "jose";

export type Role = "worker" | "employer" | "admin";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
};

const allowedRoles: Role[] = ["worker", "employer", "admin"];

export async function getUserFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-this-in-production");
    const { payload } = await jwtVerify(token, secret);
    const id = Number(payload.sub);
    const email = typeof payload.email === "string" ? payload.email : null;
    const role = typeof payload.role === "string" ? payload.role : null;

    if (!id || !email || !role || !allowedRoles.includes(role as Role)) {
      return null;
    }

    return {
      id,
      email,
      role: role as Role,
    };
  } catch {
    return null;
  }
}