import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RazorpayService, PLANS } from "@/services/razorpay.service";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planType, charityPercentage } = body;
    
    if (!['monthly', 'yearly'].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }
    if (typeof charityPercentage !== 'number' || charityPercentage < 10 || charityPercentage > 100) {
      return NextResponse.json({ error: "Invalid charity percentage" }, { status: 400 });
    }

    console.log(`Checking existing subscriptions for user: ${user.id}`);
    const { data: activeSubscriptions, error: activeSubError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);

    if (activeSubError) {
      console.error("Error fetching active subscriptions:", activeSubError);
      throw activeSubError;
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      console.warn(`User ${user.id} attempted to purchase a subscription while having an active one.`);
      return NextResponse.json({ 
        error: "You already have an active subscription. Please cancel it before purchasing a new one." 
      }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('razorpay_customer_id, full_name, email')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    let customerId = userData.razorpay_customer_id;

    if (!customerId) {
      customerId = await RazorpayService.createCustomer(
        userData.email || user.email!, 
        userData.full_name || "Golfer"
      );
      
      await supabase
        .from('users')
        .update({ razorpay_customer_id: customerId })
        .eq('id', user.id);
    }

    const plan = PLANS[planType];
    console.log("Customer ID =", customerId);
console.log("Plan ID =", plan.id);
    const { subscriptionId } = await RazorpayService.createSubscription(
      customerId, 
      plan.id, 
      charityPercentage
    );

    return NextResponse.json({ subscriptionId });
  } catch (error: any) {
    console.error("Subscription Error:", error);
    
    // Determine if it's a Razorpay API error
    const statusCode = error?.statusCode || 500;
    let errorMessage = error?.message || "An unexpected error occurred while creating your subscription.";
    
    if (error?.error?.description) {
       errorMessage = error.error.description; // Razorpay specific error format
    } else if (statusCode === 401) {
       errorMessage = "Razorpay authentication failed. Please configure valid API keys.";
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: error?.error || null
    }, { status: statusCode >= 400 ? statusCode : 500 });
  }
}
