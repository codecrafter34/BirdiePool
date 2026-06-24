"use client";

import { CheckCircle2, Loader2, Save } from "lucide-react";
import Script from "next/script";
import { useState, useEffect } from "react";
import { getCharities } from "@/actions/charities";
import { getUserSubscription, updateCharityPreferences } from "@/actions/subscriptions";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [charities, setCharities] = useState<any[]>([]);
  const [selectedCharity, setSelectedCharity] = useState<string>("");
  const [charityPercentage, setCharityPercentage] = useState<number>(20);
  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [charitiesRes, subRes] = await Promise.all([
        getCharities(),
        getUserSubscription()
      ]);
      
      const loadedCharities = charitiesRes.charities || [];
      if (loadedCharities.length > 0) {
        setCharities(loadedCharities);
        setSelectedCharity(loadedCharities[0].id);
      }

      const active = subRes.subscription;
      if (active && active.status === 'active') {
        setActiveSub(active);
        if (active.charity_id) setSelectedCharity(active.charity_id);
        if (active.contribution_percentage) setCharityPercentage(active.contribution_percentage);
      }
    }
    loadData();
  }, []);

  const handleSavePreferences = async () => {
    if (!activeSub) return;
    setIsSavingPref(true);
    try {
      const res = await updateCharityPreferences(selectedCharity, charityPercentage);
      if (res.error) throw new Error(res.error);
      alert("Charity preferences updated successfully!");
    } catch (e: any) {
      alert(e.message || "Failed to update preferences");
    } finally {
      setIsSavingPref(false);
    }
  };

  const handleCheckout = async (planType: 'monthly' | 'yearly') => {
    setLoading(planType);
    
    try {
      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, charityPercentage })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

      // Ensure Razorpay key is present
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error("Razorpay Key ID is not configured in the environment.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "BirdiePool",
        description: planType === 'yearly' ? "Yearly Premium" : "Monthly Standard",
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                planType,
                charityPercentage,
                charityId: selectedCharity
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Failed to verify');

            alert(`Successfully upgraded to ${planType} plan!`);
            window.location.reload();
          } catch (e: any) {
            console.error("Verification Error:", e);
            alert("Payment successful but verification failed: " + e.message);
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          name: "Golfer Profile",
          email: "golfer@birdiepool.com",
        },
        theme: {
          color: "#10B981"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Razorpay widget error:", response.error);
        alert("Payment failed: " + (response.error.description || "Unknown error"));
        setLoading(null);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout Error:", err);
      alert(err.message || "Failed to create subscription");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage Subscription</h1>
        <p className="text-muted-foreground mt-1">Choose your plan and select your impact contribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Monthly Plan */}
        <div className="p-8 rounded-2xl border border-border hover:border-primary/50 bg-card relative overflow-hidden group transition-colors duration-300">
          <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-white">$10</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Full access to monthly draws</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Support your chosen charity</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>AI Performance Insights</span>
            </li>
          </ul>

          <button 
            onClick={() => handleCheckout('monthly')}
            disabled={loading === 'monthly' || charities.length === 0 || !!activeSub}
            className="w-full bg-secondary text-white font-medium rounded-lg px-4 py-3 hover:bg-secondary/80 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'monthly' && <Loader2 className="w-4 h-4 animate-spin" />}
            {activeSub?.plan_type === 'monthly' ? 'Current Plan' : 'Select Monthly'}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="p-8 rounded-2xl border-2 border-primary bg-card relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 rounded-bl-lg text-xs font-bold uppercase tracking-wider">
            Best Value
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Yearly</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-extrabold text-white">$100</span>
            <span className="text-muted-foreground">/year</span>
          </div>
          
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <span>Everything in Monthly</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Save $20 annually</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <span>Priority draw processing</span>
            </li>
          </ul>

          <button 
            onClick={() => handleCheckout('yearly')}
            disabled={loading === 'yearly' || charities.length === 0 || !!activeSub}
            className="w-full bg-primary text-primary-foreground font-medium rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'yearly' && <Loader2 className="w-4 h-4 animate-spin" />}
            {activeSub?.plan_type === 'yearly' ? 'Current Plan' : 'Select Yearly'}
          </button>
        </div>

      </div>

      <div className="p-8 rounded-2xl border border-border bg-card mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold text-white">Charity Contribution Settings</h3>
          {activeSub && (
            <button
              onClick={handleSavePreferences}
              disabled={isSavingPref}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSavingPref ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </button>
          )}
        </div>
        
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Charity
            </label>
            <select
              value={selectedCharity}
              onChange={(e) => {
                console.log('User selected charity ID:', e.target.value);
                setSelectedCharity(e.target.value);
              }}
              disabled={charities.length === 0}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            >
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>{charity.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Contribution Percentage (Min 10%)
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={charityPercentage}
                onChange={(e) => setCharityPercentage(Number(e.target.value))}
                className="flex-1 accent-primary" 
              />
              <span className="text-xl font-bold text-white w-16 text-right">{charityPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Choose how much of your subscription goes directly to your selected charity. The rest funds the prize pool and platform operations.
            </p>
          </div>
        </div>
      </div>
      
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
