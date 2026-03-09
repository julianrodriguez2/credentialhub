import { NextResponse } from "next/server";

import { TOKEN_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}