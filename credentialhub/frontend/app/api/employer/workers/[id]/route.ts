import {
  forwardJsonRequest,
  getAccessTokenFromCookie,
  unauthorizedResponse,
} from "@/app/api/worker/utils";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Context) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  return forwardJsonRequest(`/api/employer/workers/${params.id}`, "GET", token);
}
