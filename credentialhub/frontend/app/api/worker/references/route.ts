import { NextResponse } from "next/server";

import {
  forwardJsonRequest,
  getAccessTokenFromCookie,
  unauthorizedResponse,
} from "@/app/api/worker/utils";

export async function GET() {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  return forwardJsonRequest("/api/worker/references", "GET", token);
}

export async function POST(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await request.json();
  return forwardJsonRequest("/api/worker/references", "POST", token, payload);
}

export async function DELETE(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ detail: "Missing id query parameter." }, { status: 400 });
  }

  return forwardJsonRequest(
    `/api/worker/references?id=${encodeURIComponent(id)}`,
    "DELETE",
    token,
  );
}
