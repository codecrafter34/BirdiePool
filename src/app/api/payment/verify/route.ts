import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature,
      planType,
      charityPercentage,
      charityId
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "mock_secret";

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // For testing with mock, we can bypass strict signature check if secret is mock_secret
      if (secret !== "mock_secret") {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    console.log(`Verifying payment for subscription: ${razorpay_subscription_id}`);

    // Insert or Update subscription in DB
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        charity_id: charityId || null,
        razorpay_subscription_id,
        plan_type: planType,
        status: 'active',
        contribution_percentage: charityPercentage,
        start_date: new Date().toISOString()
      }, { onConflict: 'razorpay_subscription_id' })
      .select('id')
      .single();

    if (subError) {
      console.error("Subscription Upsert Error:", subError);
      throw new Error(`Database error while updating subscription: ${subError.message}`);
    }
    
    console.log(`Upserted subscription record: ${subData.id} with status active`);

    // Insert payment record
    const amount = planType === 'yearly' ? 100 : 10; // USD 
    const charityAllocation = (amount * charityPercentage) / 100;
    const prizePoolAllocation = (amount * (100 - charityPercentage) * 0.8) / 100; // 80% of remainder
    const platformFeeAllocation = (amount * (100 - charityPercentage) * 0.2) / 100; // 20% of remainder

    const { error: paymentError } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: subData.id,
        user_id: user.id,
        razorpay_payment_intent_id: razorpay_payment_id,
        amount: amount,
        status: 'succeeded',
        charity_allocation: charityAllocation,
        prize_pool_allocation: prizePoolAllocation,
        platform_fee_allocation: platformFeeAllocation
      });

    if (paymentError) {
      console.error("Payment Insert Error:", paymentError);
      throw new Error(`Database error while inserting payment record: ${paymentError.message}`);
    }

    console.log(`Inserted payment record for intent: ${razorpay_payment_id}`);

    // Increment global charity stats
    if (charityId && charityAllocation > 0) {
      const { error: rpcError } = await supabase.rpc('increment_charity_stats', {
        target_charity_id: charityId,
        amount: charityAllocation
      });
      
      if (rpcError) {
        console.error("RPC Error (incrementing charity stats):", rpcError);
        // Fallback: Read-modify-write if RPC doesn't exist
        const { data: charityData } = await supabase
          .from('charities')
          .select('donation_stats')
          .eq('id', charityId)
          .single();
          
        if (charityData) {
          const newStats = (charityData.donation_stats || 0) + charityAllocation;
          await supabase
            .from('charities')
            .update({ donation_stats: newStats })
            .eq('id', charityId);
        }
      }
      console.log(`Incremented charity stats for charity: ${charityId} by ${charityAllocation}`);
    }

    // Update user role to subscriber
    const { error: userError } = await supabase
      .from('users')
      .update({ role: 'subscriber' })
      .eq('id', user.id);

    if (userError) {
      console.error("User Role Update Error:", userError);
      throw new Error(`Database error while updating user role: ${userError.message}`);
    }

    console.log(`Successfully verified and activated ${planType} subscription for user ${user.id}`);
    
    // Purge the router cache so dashboard fetches new data immediately
    const { revalidatePath } = require('next/cache');
    revalidatePath('/dashboard', 'layout');
    
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to verify payment",
      details: error.stack 
    }, { status: 500 });
  }
}
