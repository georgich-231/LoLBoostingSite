import { finishOAuth } from "@/app/api/auth/_oauth-routes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return finishOAuth("google", request);
}
