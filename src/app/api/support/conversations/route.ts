import {
  appendUserSupportRequest,
  createEmptySupportConversation,
  createPreparedSupportConversation,
  listSupportConversations,
  normalizeVisitorId,
  sanitizeSupportBody,
} from "@/server/services/support";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const visitorId = normalizeVisitorId(searchParams.get("visitorId"));

  const conversations = await listSupportConversations({ user, visitorId });

  return Response.json({ conversations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

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

    if (typeof body.supportMessage === "string" && sanitizeSupportBody(body.supportMessage)) {
      const conversation = await createEmptySupportConversation({ user, visitorId });
      const updatedConversation = await appendUserSupportRequest({
        user,
        visitorId,
        conversationId: conversation.id,
        body: body.supportMessage,
      });

      return Response.json({ conversation: updatedConversation }, { status: 201 });
    }

    const conversation =
      typeof body.questionKey === "string"
        ? await createPreparedSupportConversation({
            user,
            visitorId,
            questionKey: body.questionKey,
          })
        : await createEmptySupportConversation({ user, visitorId });

    return Response.json({ conversation }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to create support chat" }, { status: 500 });
  }
}
