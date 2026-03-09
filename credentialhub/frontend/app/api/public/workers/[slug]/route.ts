import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const response = await fetch(
    `${BACKEND_URL}/api/public/workers/${encodeURIComponent(params.slug)}`,
    {
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { detail: data.detail ?? "Request failed." },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}
