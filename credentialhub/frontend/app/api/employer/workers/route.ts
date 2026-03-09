import {
  forwardJsonRequest,
  getAccessTokenFromCookie,
  unauthorizedResponse,
} from "@/app/api/worker/utils";

export async function GET(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const query = new URL(request.url).search;
  return forwardJsonRequest(`/api/employer/workers${query}`, "GET", token);
}
