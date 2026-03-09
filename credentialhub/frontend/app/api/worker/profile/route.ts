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

  return forwardJsonRequest("/api/worker/profile", "GET", token);
}

export async function PUT(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await request.json();
  return forwardJsonRequest("/api/worker/profile", "PUT", token, payload);
}
