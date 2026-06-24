import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in INR or USD
  interval: 'month' | 'year';
}

export const PLANS: Record<string, SubscriptionPlan> = {
  monthly: { 
    id: process.env.NEXT_PUBLIC_RAZORPAY_MONTHLY_PLAN_ID || '', 
    name: 'Monthly Standard', 
    price: 1000, 
    interval: 'month' 
  },
  yearly: { 
    id: process.env.NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID || '', 
    name: 'Yearly Premium', 
    price: 10000, 
    interval: 'year' 
  },
};

export class RazorpayService {
  static async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await razorpay.customers.create({
        name,
        email,
        fail_existing: 0,
      });
      return customer.id;
    } catch (error) {
      console.error("Razorpay Create Customer Error:", error);
      throw error;
    }
  }

  static async createSubscription(
    customerId: string, 
    planId: string, 
    charityPercentage: number
  ): Promise<{ subscriptionId: string; status: string; }> {
    try {
      if (!planId) {
        throw new Error("Plan ID is missing. Have you configured NEXT_PUBLIC_RAZORPAY_MONTHLY_PLAN_ID and NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID in .env.local?");
      }

      const payload: any = {
        plan_id: planId,
        customer_id: customerId,
        total_count: 10, // arbitrary high number for recurring
        notes: {
          charityPercentage: charityPercentage.toString()
        }
      };
      const subscription = await razorpay.subscriptions.create(payload);
      
      return {
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      console.error("Razorpay Error:", error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await razorpay.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error("Razorpay Error:", error);
      return false;
    }
  }
}
