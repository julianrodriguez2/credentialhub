import { NextResponse } from "next/server";

import { TOKEN_COOKIE_NAME, TOKEN_MAX_AGE_SECONDS } from "@/lib/constants";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  const payload = await request.json();
  const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(payload),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(
      { detail: data.detail ?? "Unable to login." },
      { status: backendResponse.status },
    );
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: data.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}
