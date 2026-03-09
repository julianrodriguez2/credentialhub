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

export async function POST(_: Request, { params }: Context) {
  const token = getAccessTokenFromCookie();
  if (!token) {
    return unauthorizedResponse();
  }

  return forwardJsonRequest(
    `/api/worker/references/send-verification/${params.id}`,
    "POST",
    token,
  );
}
