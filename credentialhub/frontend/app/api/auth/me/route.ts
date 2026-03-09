import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE_NAME } from "@/lib/constants";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  const token = cookies().get(TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(`${BACKEND_URL}/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(
      { detail: data.detail ?? "Unauthorized" },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(data);
}
