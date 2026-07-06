import {
  appendPreparedSupportAnswer,
  appendUserSupportRequest,
  normalizeVisitorId,
  sanitizeSupportBody,
} from "@/server/services/support";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  const user = await getCurrentUser();
  const { conversationId } = await context.params;

  try {
    const body = (await request.json()) as {
      visitorId?: unknown;
      questionKey?: unknown;
      supportMessage?: unknown;
    };
    const visitorId = normalizeVisitorId(body.visitorId);

    if (!visitorId && !user) {
      return Response.json({ error: "Missing visitor" }, { status: 400 });
    }

    if (typeof body.questionKey === "string") {
      const conversation = await appendPreparedSupportAnswer({
        user,
        visitorId,
        conversationId,
        questionKey: body.questionKey,
      });

      return Response.json({ conversation });
    }

    const supportMessage = sanitizeSupportBody(body.supportMessage);

    if (!supportMessage) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const conversation = await appendUserSupportRequest({
      user,
      visitorId,
      conversationId,
      body: supportMessage,
    });

    return Response.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send message";
    const status =
      message.includes("access") || message.includes("not found")
        ? 403
        : message.includes("Unknown") || message.includes("required")
          ? 400
          : 500;

    return Response.json({ error: message }, { status });
  }
}
