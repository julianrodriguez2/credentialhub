import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { TOKEN_COOKIE_NAME } from "@/lib/constants";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export function unauthorizedResponse() {
  return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
}

export function getAccessTokenFromCookie() {
  return cookies().get(TOKEN_COOKIE_NAME)?.value;
}

export async function forwardJsonRequest(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  token: string,
  payload?: unknown,
) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { detail: data.detail ?? "Request failed." },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
