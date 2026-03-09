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

  return forwardJsonRequest("/api/worker/resume/", "GET", token);
}

export async function POST() {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  return forwardJsonRequest("/api/worker/resume/generate", "POST", token);
}
