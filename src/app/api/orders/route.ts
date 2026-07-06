import { checkoutSchema } from "@/server/validation";
import { createOrder, listOrdersForUser } from "@/server/services/orders";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orders = await listOrdersForUser(user.id);

  return Response.json({ orders });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid order details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const order = await createOrder({
      userId: user.id,
      ...parsed.data,
    });

    return Response.json({ order }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to create order" }, { status: 500 });
  }
}
