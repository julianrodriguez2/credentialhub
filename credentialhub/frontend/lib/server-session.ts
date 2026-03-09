import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserFromToken, type Role, type SessionUser } from "@/lib/auth";
import { TOKEN_COOKIE_NAME } from "@/lib/constants";

export function roleDashboardPath(role: Role): string {
  if (role === "worker") {
    return "/dashboard/worker/profile";
  }
  if (role === "employer") {
    return "/dashboard/employer";
  }
  return "/dashboard/admin";
}

export async function requireSessionUser(): Promise<SessionUser> {
  const token = cookies().get(TOKEN_COOKIE_NAME)?.value;
  const user = await getUserFromToken(token);
  if (!user) {
    redirect("/login");
  }
  return user;
}
