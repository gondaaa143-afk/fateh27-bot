"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://fateh27-bot.onrender.com").replace(/\/$/, "");

export default function PremiumPage() {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [premium, setPremium] = useState(false);
  const [endsAt, setEndsAt] = useState(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

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

        const response = await fetch(API_BASE + "/api/access", {
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

  async function startPayment() {
    setError("");
    setPaymentMessage("");

    const telegram = window.Telegram?.WebApp;
    if (!telegram?.initData) {
      setError("FATEH27 ko Telegram Mini App ke andar open karo.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Payment ke liye 10-digit mobile number enter karo.");
      return;
    }

    try {
      setPaying(true);
      setPaymentMessage("Secure payment order create ho raha hai...");

      const response = await fetch(API_BASE + "/api/payments/create-order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-telegram-init-data": telegram.initData
        },
        body: JSON.stringify({ phone: cleanPhone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Payment order create nahi hua.");
      }

      if (!data?.paymentSessionId) {
        throw new Error("Payment session nahi mila.");
      }

      const scriptId = "cashfree-sdk";
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
      }

      await new Promise((resolve, reject) => {
        if (window.Cashfree) return resolve();
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", () => reject(new Error("Cashfree checkout load nahi hua.")), { once: true });
      });

      const cashfree = window.Cashfree({
        mode: data.environment === "sandbox" ? "sandbox" : "production"
      });

      setPaymentMessage("Cashfree checkout open ho raha hai...");
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self"
      });
    } catch (paymentError) {
      console.error("FATEH27 payment:", paymentError);
      setError(paymentError?.message || "Payment start nahi ho paya.");
      setPaymentMessage("");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eee7d8] text-[#26271f] pb-10">
      <div className="max-w-md mx-auto px-4 pt-5">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-[#4d5238] mb-5 font-semibold"
        >
          ← Dashboard
        </button>

        <div className="rounded-[26px] bg-[#4d5238] text-white p-6 shadow-[0_18px_42px_rgba(56,52,38,.16)]">
          <p className="text-white/60 text-sm">FATEH27 Membership</p>
          <h1 className="text-3xl font-black mt-2">Premium</h1>
          <p className="text-white/70 text-sm mt-3">
            Premium UPSC content aur features ke liye secure payment.
          </p>

          {premium && (
            <div className="mt-5 bg-white/10 rounded-2xl p-4 border border-white/10">
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

        <div className="mt-5 rounded-[26px] bg-[#fffaf0] border border-[#4d5238]/10 p-6 shadow-[0_14px_34px_rgba(56,52,38,.10)]">
          <p className="text-xs font-semibold text-[#666] uppercase tracking-wide">Premium includes</p>

          <div className="mt-4 space-y-3">
            {[
              "Premium UPSC study material",
              "Premium PYQ and practice content",
              "Premium AI-assisted study features",
              "Server-verified access"
            ].map((item) => (
              <div key={item} className="flex gap-3 items-center">
                <span className="w-7 h-7 rounded-full bg-[#4d5238] text-white flex items-center justify-center text-xs">✓</span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          {!premium && (
            <>
              <label className="block text-sm font-semibold mt-6 mb-2">
                Mobile number
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className="w-full rounded-[16px] border border-[#4d5238]/15 bg-[#fffdf7] px-4 py-3 outline-none text-[#26271f]"
              />

              <button
                onClick={startPayment}
                disabled={paying || status !== "ready"}
                className="w-full mt-4 rounded-[18px] bg-[#4d5238] text-white py-3 font-bold disabled:opacity-40 shadow-[0_8px_18px_rgba(63,68,47,.18)]"
              >
                {paying ? "Opening Payment..." : "Pay Securely with UPI"}
              </button>

              {paymentMessage && (
                <p className="text-xs text-[#555] text-center mt-3">{paymentMessage}</p>
              )}

              {error && (
                <p className="text-xs text-red-600 text-center mt-3">{error}</p>
              )}

              <p className="text-[11px] text-[#777] text-center mt-4">
                Payment Cashfree secure checkout par process hoga. FATEH27 premium tabhi activate karega jab server payment verify karega.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
