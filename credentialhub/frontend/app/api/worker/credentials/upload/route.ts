import {
  forwardMultipartRequest,
  getAccessTokenFromCookie,
  unauthorizedResponse,
} from "@/app/api/worker/utils";

export async function POST(request: Request) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  return forwardMultipartRequest("/api/worker/credentials/upload", token, formData);
}
