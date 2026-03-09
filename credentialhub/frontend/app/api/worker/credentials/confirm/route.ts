import {
  forwardJsonRequest,
  getAccessTokenFromCookie,
  unauthorizedResponse,
} from "@/app/api/worker/utils";

export async function POST(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const payload = await request.json();
  return forwardJsonRequest("/api/worker/credentials/confirm", "POST", token, payload);
}
