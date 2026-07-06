import { startOAuth } from "@/app/api/auth/_oauth-routes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return startOAuth("discord", request);
}
