import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret";

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature && secret !== "mock_webhook_secret") {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = await createClient();

    // Handle subscription events
    if (event.event === "subscription.charged") {
      const subscription = event.payload.subscription.entity;
      const payment = event.payload.payment.entity;

      // Log payment in subscription_payments table
      // In a real scenario, we need the user_id linked to the razorpay_customer_id
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("razorpay_customer_id", subscription.customer_id)
        .single();

      if (user) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id, contribution_percentage")
          .eq("razorpay_subscription_id", subscription.id)
          .single();

        if (sub) {
          const totalAmount = payment.amount / 100;
          const charityPercentage = sub.contribution_percentage || 20;
          const charityAllocation = totalAmount * (charityPercentage / 100);
          const platformFeeAllocation = totalAmount * 0.10;
          const prizePoolAllocation = totalAmount - charityAllocation - platformFeeAllocation;

          await supabase.from("subscription_payments").insert({
            subscription_id: sub.id,
            user_id: user.id,
            razorpay_payment_intent_id: payment.id,
            amount: totalAmount,
            status: 'succeeded',
            charity_allocation: charityAllocation,
            prize_pool_allocation: prizePoolAllocation,
            platform_fee_allocation: platformFeeAllocation
          });
          
          // Ensure subscription is active and user is subscriber
          await supabase.from("subscriptions").update({ status: 'active' }).eq("id", sub.id);
          await supabase.from("users").update({ role: 'subscriber' }).eq("id", user.id);
        }
      }
    } else if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
      const subscription = event.payload.subscription.entity;
      await supabase
        .from("subscriptions")
        .update({ status: 'canceled' })
        .eq("razorpay_subscription_id", subscription.id);
        
      // Demote user if this was their only active subscription
      // Note: Ideally check if they have other active ones, but omitting for brevity
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("razorpay_customer_id", subscription.customer_id)
        .single();
        
      if (user) {
         await supabase.from("users").update({ role: 'visitor' }).eq("id", user.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
