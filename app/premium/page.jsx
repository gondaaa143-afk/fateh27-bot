"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [premium, setPremium] = useState(false);
  const [endsAt, setEndsAt] = useState(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const telegram = window.Telegram?.WebApp;
        telegram?.ready();
        telegram?.expand();

        if (!telegram?.initData) {
          setStatus("telegram-required");
          return;
        }

        const response = await fetch("/api/access", {
          headers: { "x-telegram-init-data": telegram.initData }
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data?.detail || data?.error || "Access check failed");

        setPremium(Boolean(data.premium));
        setEndsAt(data.subscriptionEndsAt || null);
        setStatus("ready");
      } catch (error) {
        console.error("FATEH27 premium access:", error);
        setStatus("error");
      }
    }

    checkAccess();
  }, []);

  const checkoutUrl = process.env.NEXT_PUBLIC_PAYMENT_CHECKOUT_URL;

  function startPayment() {
    if (!checkoutUrl) return;
    window.location.href = checkoutUrl;
  }

  return (
    <main className="min-h-screen bg-[#F4F4F4] pb-10">
      <div className="max-w-md mx-auto px-5 pt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-[#666] mb-6"
        >
          ← Dashboard
        </button>

        <div className="hero-card p-6">
          <p className="text-white/60 text-sm">FATEH27 Membership</p>
          <h1 className="text-3xl font-black mt-2">Premium</h1>
          <p className="text-white/70 text-sm mt-3">
            Premium content access is controlled server-side. Your plan cannot be changed from the client.
          </p>

          {premium && (
            <div className="mt-5 bg-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/60">Current status</p>
              <p className="font-bold mt-1">Premium Active</p>
              {endsAt && (
                <p className="text-xs text-white/60 mt-1">
                  Valid until {new Date(endsAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 glass rounded-[30px] p-6">
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wide">Premium includes</p>
          <div className="mt-4 space-y-3">
            {[
              "Premium UPSC study material",
              "Premium PYQ and practice content",
              "Premium AI-assisted study features",
              "Server-verified access"
            ].map((item) => (
              <div key={item} className="flex gap-3 items-center">
                <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs">✓</span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={startPayment}
            disabled={premium || !checkoutUrl || status !== "ready"}
            className="w-full mt-6 rounded-[18px] bg-black text-white py-3 font-bold disabled:opacity-40"
          >
            {premium ? "Premium Active" : checkoutUrl ? "Continue to Payment" : "Payment Gateway Setup Pending"}
          </button>

          {!premium && !checkoutUrl && (
            <p className="text-xs text-[#777] text-center mt-3">
              Payment UI is ready. Connect the payment checkout URL before accepting payments.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
