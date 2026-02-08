import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getUserData, setUserData } from "@/lib/kv";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const xUserId = session.metadata?.x_user_id;

    if (!xUserId) {
      console.error("Webhook: missing x_user_id in metadata");
      return NextResponse.json({ received: true });
    }

    const userData = await getUserData(xUserId);
    if (!userData) {
      console.error("Webhook: user not found in KV:", xUserId);
      return NextResponse.json({ received: true });
    }

    // Dedup by Stripe session ID
    if (userData.stripeSessionIds.includes(session.id)) {
      return NextResponse.json({ received: true });
    }

    userData.paidBatches += 1;
    userData.stripeSessionIds.push(session.id);
    await setUserData(xUserId, userData);
  }

  return NextResponse.json({ received: true });
}
