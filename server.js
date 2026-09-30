import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import accessHandler from "./api/access.js";
import telegramWebhookHandler from "./api/webhook.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 10000;

const MODEL =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

const API_KEY =
  process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn(
    "OPENAI_API_KEY is not set."
  );
}

const openai =
  API_KEY
    ? new OpenAI({
        apiKey: API_KEY
      })
    : null;


/* =========================================================
   MIDDLEWARE
   ========================================================= */

app.set("trust proxy", 1);

const RATE_WINDOW_MS = 15 * 60 * 1000;
const rateBuckets = new Map();
const RATE_LIMITS = { general: 120, translate: 20, evaluate: 10, secretary: 30, tts: 15 };

function getTelegramUserId(req) {
  const initData = String(req.headers["x-telegram-init-data"] || "").trim();
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = Number(params.get("auth_date"));
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!hash || !authDate || !botToken) return null;

    if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > 24 * 60 * 60) return null;

    const dataCheckString = [...params.entries()]
      .filter(([key]) => key !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => key + "=" + value)
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    const received = Buffer.from(hash, "hex");
    const expected = Buffer.from(expectedHash, "hex");

    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

    const user = JSON.parse(params.get("user") || "{}");
    return user?.id ? String(user.id) : null;
  } catch {
    return null;
  }
}


const DAILY_AI_LIMITS = {
  translate: Number(process.env.AI_DAILY_TRANSLATE_LIMIT || 50),
  evaluate: Number(process.env.AI_DAILY_EVALUATE_LIMIT || 20),
  secretary: Number(process.env.AI_DAILY_SECRETARY_LIMIT || 50),
  tts: Number(process.env.AI_DAILY_TTS_LIMIT || 30)
};

function getFirebaseConfigForUsage() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

async function getFirebaseAccessTokenForUsage() {
  const config = getFirebaseConfigForUsage();
  if (!config) return null;

  const now = Math.floor(Date.now() / 1000);
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  });
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" +
      encodeURIComponent(unsigned + "." + signature)
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.access_token || null;
}

async function consumeDailyAiQuota(req, bucket) {
  const telegramUserId = getTelegramUserId(req);
  const limit = DAILY_AI_LIMITS[bucket];

  if (!telegramUserId || !Number.isFinite(limit) || limit <= 0) {
    return { allowed: true, tracked: false };
  }

  const config = getFirebaseConfigForUsage();
  if (!config) {
    return { allowed: true, tracked: false };
  }

  const token = await getFirebaseAccessTokenForUsage();
  if (!token) {
    return { allowed: true, tracked: false };
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const documentId = encodeURIComponent(telegramUserId + "_" + dateKey);
  const baseUrl = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(config.projectId) +
    "/databases/(default)/documents/aiUsage/" + documentId;

  const begin = await fetch(
    "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(config.projectId) +
      "/databases/(default)/documents:beginTransaction",
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json"
      },
      body: JSON.stringify({ options: {} })
    }
  );

  if (!begin.ok) {
    return { allowed: true, tracked: false };
  }

  const transaction = (await begin.json()).transaction;
  if (!transaction) return { allowed: true, tracked: false };

  const read = await fetch(baseUrl + "?transaction=" + encodeURIComponent(transaction), {
    headers: { authorization: "Bearer " + token }
  });

  let current = 0;
  let exists = false;

  if (read.ok) {
    const doc = await read.json();
    exists = true;
    current = Number(doc?.fields?.[bucket]?.integerValue || 0);
  } else if (read.status !== 404) {
    return { allowed: true, tracked: false };
  }

  if (current >= limit) {
    await fetch(
      "https://firestore.googleapis.com/v1/projects/" +
        encodeURIComponent(config.projectId) +
        "/databases/(default)/documents:rollback",
      {
        method: "POST",
        headers: {
          authorization: "Bearer " + token,
          "content-type": "application/json"
        },
        body: JSON.stringify({ transaction })
      }
    ).catch(() => {});

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      allowed: false,
      tracked: true,
      limit,
      used: current,
      retryAt: tomorrow.toISOString()
    };
  }

  const fields = {
    telegramUserId: { stringValue: telegramUserId },
    date: { stringValue: dateKey },
    [bucket]: { integerValue: String(current + 1) },
    updatedAt: { timestampValue: new Date().toISOString() }
  };

  const commit = await fetch(
    "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(config.projectId) +
      "/databases/(default)/documents:commit",
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        transaction,
        writes: [{
          update: {
            name: "projects/" + config.projectId + "/databases/(default)/documents/aiUsage/" + documentId,
            fields
          },
          ...(exists ? {} : {})
        }]
      })
    }
  );

  if (!commit.ok) {
    return { allowed: true, tracked: false };
  }

  return {
    allowed: true,
    tracked: true,
    limit,
    used: current + 1,
    remaining: Math.max(0, limit - current - 1)
  };
}

async function enforceDailyAiQuota(req, res, bucket) {
  try {
    const result = await consumeDailyAiQuota(req, bucket);
    if (result.tracked) {
      res.setHeader("X-AI-Daily-Limit", String(result.limit));
      res.setHeader("X-AI-Daily-Used", String(result.used));
      res.setHeader("X-AI-Daily-Remaining", String(Math.max(0, result.remaining || 0)));
    }

    if (!result.allowed) {
      if (result.retryAt) res.setHeader("X-AI-Daily-Retry-At", result.retryAt);
      return res.status(429).json({
        error: "Daily AI limit reached.",
        limit: result.limit,
        used: result.used,
        retryAt: result.retryAt
      });
    }

    return true;
  } catch (error) {
    console.error("Daily AI quota check failed:", error);
    return true;
  }
}

function rateLimit(bucket, limit) {
  return (req, res, next) => {
    const now = Date.now();
    const telegramUserId = getTelegramUserId(req);
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const key = bucket + ":" + (telegramUserId ? "tg:" + telegramUserId : "ip:" + ip);
    let entry = rateBuckets.get(key);

    if (!entry || now - entry.startedAt >= RATE_WINDOW_MS) {
      entry = { startedAt: now, count: 0 };
    }

    entry.count += 1;
    rateBuckets.set(key, entry);

    if (rateBuckets.size > 10000) {
      for (const [storedKey, stored] of rateBuckets) {
        if (now - stored.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(storedKey);
      }
    }

    const remaining = Math.max(0, limit - entry.count);
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (entry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - entry.startedAt)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    next();
  };
}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(cors());
app.use(rateLimit("general", RATE_LIMITS.general));

app.use(
  express.json({
    limit: "8mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);

/* Telegram Bot webhook must stay public: Telegram does not send Mini App initData. */
app.post("/api/webhook", (req, res) => telegramWebhookHandler(req, res));

/* =========================================================
   FATEH27 ACCESS ENFORCEMENT
   Every protected API requires a valid Telegram identity AND
   explicit admin approval. Access/request/webhook/health and
   secret-authenticated notification endpoints stay public.
   ========================================================= */

async function requireApprovedApiUser(req, res, next) {
  const pathName = String(req.path || "");

  if (
    req.method === "OPTIONS" ||
    pathName === "/api/health" ||
    pathName === "/api/access" ||
    pathName === "/api/payments/cashfree/webhook" ||
    pathName === "/api/notifications/current-affairs"
  ) {
    return next();
  }

  if (!pathName.startsWith("/api/")) return next();

  const initData = String(req.headers["x-telegram-init-data"] || "").trim();
  const telegramUserId = getTelegramUserId(req);

  if (!initData || !telegramUserId) {
    return res.status(401).json({
      error: "Telegram authentication is required"
    });
  }

  const adminId = String(process.env.FATEH27_ADMIN_ID || "5496422260");
  if (telegramUserId === adminId) return next();

  try {
    const config = getFirebaseConfigForUsage();
    const token = await getFirebaseAccessTokenForUsage();

    if (!config || !token) {
      return res.status(503).json({ error: "Access verification is unavailable" });
    }

    const accessUrl =
      "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(config.projectId) +
      "/databases/(default)/documents/accessRequests/" +
      encodeURIComponent(telegramUserId);

    const accessResponse = await fetch(accessUrl, {
      headers: { authorization: "Bearer " + token }
    });

    if (!accessResponse.ok) {
      return res.status(403).json({
        error: "FATEH27 access approval required",
        status: accessResponse.status === 404 ? "not_requested" : "unknown"
      });
    }

    const accessDoc = await accessResponse.json();
    const status = String(accessDoc?.fields?.status?.stringValue || "").toLowerCase();

    if (status !== "approved") {
      return res.status(403).json({
        error: "FATEH27 access approval required",
        status: status || "not_requested"
      });
    }

    return next();
  } catch (error) {
    console.error("FATEH27 access enforcement error:", error);
    return res.status(503).json({ error: "Access verification failed" });
  }
}

app.use(requireApprovedApiUser);


/* =========================================================
   PATH
   ========================================================= */

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(value) {
  return String(
    value ?? ""
  ).trim();
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      service:
        "fateh27-backend",

      model:
        MODEL,

      openaiConfigured:
        Boolean(API_KEY)

    });

  }
);



/* =========================================================
   FATEH27
   CASHFREE PAYMENTS
   ========================================================= */

const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2025-01-01";
const CASHFREE_ENV = process.env.CASHFREE_ENV || "production";
const CASHFREE_BASE_URL =
  CASHFREE_ENV === "sandbox"
    ? "https://sandbox.cashfree.com"
    : "https://api.cashfree.com";

const PREMIUM_PRICE_INR = Number(process.env.PREMIUM_PRICE_INR || 499);
const PREMIUM_DURATION_DAYS = Number(process.env.PREMIUM_DURATION_DAYS || 30);
const PUBLIC_API_URL = String(process.env.PUBLIC_API_URL || "https://fateh27-bot.onrender.com").replace(/\/$/, "");
const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");

function getCashfreeConfig() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

async function listApprovedTelegramUsers() {
  const { projectId } = getFirebaseConfigForUsage() || {};
  if (!projectId) throw new Error("Firebase server credentials are not configured");
  const token = await getFirebaseAccessTokenForUsage();
  if (!token) throw new Error("Firebase access token unavailable");

  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/users?pageSize=100";
  const response = await fetch(url, { headers: { authorization: "Bearer " + token } });
  if (!response.ok) throw new Error("Approved user list failed");
  const data = await response.json();
  return (data.documents || []).map((doc) => {
    const f = doc.fields || {};
    return String(f.telegramId?.stringValue || doc.name.split("/").pop());
  }).filter(Boolean);
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: String(chatId), text: String(text).slice(0, 4096) })
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok && data.ok !== false, error: data?.description || null };
}

async function broadcastToApprovedUsers(text) {
  const users = await listApprovedTelegramUsers();
  let sent = 0, failed = 0;
  for (const userId of users) {
    const result = await sendTelegramMessage(userId, text);
    if (result.ok) sent++;
    else failed++;
  }
  return { total: users.length, sent, failed };
}

async function firestoreDocument(documentPath, options = {}) {
  const config = getFirebaseConfigForUsage();
  if (!config) throw new Error("Firebase server credentials are not configured");
  const token = await getFirebaseAccessTokenForUsage();
  if (!token) throw new Error("Firebase access token unavailable");

  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(config.projectId) +
    "/databases/(default)/documents/" + documentPath;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Firestore request failed: " + response.status + " " + detail.slice(0, 300));
  }

  return response.status === 204 ? null : response.json();
}

function firestoreFieldsForPaymentOrder({ orderId, telegramUserId, amount, status }) {
  return {
    orderId: { stringValue: orderId },
    telegramUserId: { stringValue: telegramUserId },
    amount: { doubleValue: amount },
    currency: { stringValue: "INR" },
    status: { stringValue: status },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() }
  };
}

async function createCashfreeOrder({ orderId, telegramUserId, phone }) {
  const config = getCashfreeConfig();
  if (!config) throw new Error("Cashfree credentials are not configured");

  const response = await fetch(CASHFREE_BASE_URL + "/pg/orders", {
    method: "POST",
    headers: {
      "x-client-id": config.clientId,
      "x-client-secret": config.clientSecret,
      "x-api-version": CASHFREE_API_VERSION,
      "content-type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: PREMIUM_PRICE_INR,
      order_currency: "INR",
      customer_details: {
        customer_id: "tg_" + telegramUserId,
        customer_phone: phone
      },
      order_meta: {
        return_url: PUBLIC_APP_URL
          ? PUBLIC_APP_URL + "/premium?payment=return&order_id={order_id}"
          : undefined,
        notify_url: PUBLIC_API_URL + "/api/payments/cashfree/webhook"
      },
      order_note: "FATEH27 Premium " + PREMIUM_DURATION_DAYS + " days"
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error_description || "Cashfree order creation failed");
  }
  return data;
}

app.post(
  "/api/payments/create-order",
  rateLimit("payment-create", 10),
  async (req, res) => {
    try {
      const initData = String(req.headers["x-telegram-init-data"] || "").trim();
      const telegramUserId = getTelegramUserId(req);

      if (!initData || !telegramUserId) {
        return res.status(401).json({ error: "Telegram authentication is required" });
      }

      const config = getCashfreeConfig();
      if (!config) {
        return res.status(503).json({ error: "Payment gateway is not configured yet" });
      }

      if (!Number.isFinite(PREMIUM_PRICE_INR) || PREMIUM_PRICE_INR <= 0) {
        return res.status(503).json({ error: "Premium price is not configured correctly" });
      }

      const phone = String(req.body?.phone || "").replace(/\D/g, "");
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: "Valid 10-digit mobile number is required for payment" });
      }

      const orderId =
        "F27_" +
        telegramUserId +
        "_" +
        Date.now().toString(36) +
        "_" +
        crypto.randomBytes(4).toString("hex");

      const order = await createCashfreeOrder({ orderId, telegramUserId, phone });

      await firestoreDocument(
        "paymentOrders/" + encodeURIComponent(orderId),
        {
          method: "PATCH",
          body: {
            fields: firestoreFieldsForPaymentOrder({
              orderId,
              telegramUserId,
              amount: PREMIUM_PRICE_INR,
              status: "CREATED"
            })
          }
        }
      );

      return res.json({
        orderId,
        paymentSessionId: order?.payment_session_id || null,
        amount: PREMIUM_PRICE_INR,
        currency: "INR",
        durationDays: PREMIUM_DURATION_DAYS,
        environment: CASHFREE_ENV
      });
    } catch (error) {
      console.error("/api/payments/create-order error:", error);
      return res.status(500).json({
        error: "Payment order creation failed",
        detail: error?.message || "Unknown error"
      });
    }
  }
);

function verifyCashfreeWebhook(req) {
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  const signature = String(req.headers["x-webhook-signature"] || "");
  const timestamp = String(req.headers["x-webhook-timestamp"] || "");
  const rawBody = String(req.rawBody || "");

  if (!secret || !signature || !timestamp || !rawBody) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);

  return received.length === calculated.length &&
    crypto.timingSafeEqual(received, calculated);
}

// Cashfree dashboard sandbox endpoint validation may use GET/HEAD.
if (CASHFREE_ENV === "sandbox") {
  app.get("/api/payments/cashfree/webhook", (req, res) => {
    return res.json({ ok: true, service: "fateh27-cashfree-webhook", environment: "sandbox" });
  });
}

app.post(
  "/api/payments/cashfree/webhook",
  async (req, res) => {
    try {
      if (!verifyCashfreeWebhook(req)) {
        const signature = String(req.headers["x-webhook-signature"] || "");
        const timestamp = String(req.headers["x-webhook-timestamp"] || "");

        // Cashfree's dashboard sandbox probe can arrive without webhook
        // signature headers. Acknowledge only this unsigned sandbox probe;
        // never process it as a payment and never grant premium access.
        if (CASHFREE_ENV === "sandbox" && !signature && !timestamp) {
          console.warn("Cashfree sandbox webhook probe acknowledged without signature.");
          return res.json({ received: true, test: true });
        }

        return res.status(401).json({ error: "Invalid webhook signature" });
      }

      const payload = req.body || {};
      const orderId = String(payload?.data?.order?.order_id || "");
      const paymentStatus = String(payload?.data?.payment?.payment_status || "");
      const paymentAmount = Number(payload?.data?.payment?.payment_amount || 0);

      if (!orderId) return res.status(400).json({ error: "Missing order id" });

      const orderDoc = await firestoreDocument("paymentOrders/" + encodeURIComponent(orderId));
      const orderFields = orderDoc?.fields || {};
      const telegramUserId = String(orderFields?.telegramUserId?.stringValue || "");
      const expectedAmount = Number(
        orderFields?.amount?.doubleValue ??
        orderFields?.amount?.integerValue ??
        0
      );

      if (!telegramUserId || !expectedAmount) {
        return res.status(404).json({ error: "Payment order not found" });
      }

      if (paymentStatus === "SUCCESS") {
        if (paymentAmount !== expectedAmount) {
          return res.status(400).json({ error: "Payment amount mismatch" });
        }

        const endsAt = new Date(
          Date.now() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        await firestoreDocument(
          "users/" + encodeURIComponent(telegramUserId),
          {
            method: "PATCH",
            body: {
              updateMask: {
                fieldPaths: ["plan", "subscriptionStatus", "subscriptionEndsAt"]
              },
              fields: {
                plan: { stringValue: "premium" },
                subscriptionStatus: { stringValue: "active" },
                subscriptionEndsAt: { timestampValue: endsAt }
              }
            }
          }
        );

        await firestoreDocument(
          "paymentOrders/" + encodeURIComponent(orderId),
          {
            method: "PATCH",
            body: {
              updateMask: {
                fieldPaths: ["status", "paymentId", "updatedAt"]
              },
              fields: {
                status: { stringValue: "PAID" },
                paymentId: {
                  stringValue: String(payload?.data?.payment?.cf_payment_id || "")
                },
                updatedAt: { timestampValue: new Date().toISOString() }
              }
            }
          }
        );
      } else {
        await firestoreDocument(
          "paymentOrders/" + encodeURIComponent(orderId),
          {
            method: "PATCH",
            body: {
              updateMask: {
                fieldPaths: ["status", "updatedAt"]
              },
              fields: {
                status: { stringValue: paymentStatus || "UNKNOWN" },
                updatedAt: { timestampValue: new Date().toISOString() }
              }
            }
          }
        );
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("/api/payments/cashfree/webhook error:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

app.post("/api/notifications/current-affairs", rateLimit("notifications", 10), async (req, res) => {
  try {
    const secret = String(process.env.FATEH27_NOTIFY_SECRET || "");
    const supplied = String(req.headers["x-fateh27-notify-secret"] || "");
    if (!secret || !supplied || supplied !== secret) {
      return res.status(401).json({ error: "Notification authorization failed" });
    }

    let content = cleanText(req.body?.content);
    if (!content) {
      const sourceUrl = String(req.body?.sourceUrl || "").trim();
      if (!sourceUrl) return res.status(400).json({ error: "content or sourceUrl is required" });
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error("Current affairs source fetch failed");
      content = await response.text();
    }

    const result = await broadcastToApprovedUsers(
      "📚 FATEH27 — Daily Current Affairs\\n\\n" + content
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("/api/notifications/current-affairs error:", error);
    return res.status(500).json({ error: "Notification broadcast failed", detail: error?.message || "Unknown error" });
  }
});

/* =========================================================
   FATEH27
   PYQ ENGLISH → HINDI TRANSLATION
   ========================================================= */

app.post(
  "/api/translate",
  rateLimit("translate", RATE_LIMITS.translate),
  async (req, res) => {
    if (!(await enforceDailyAiQuota(req, res, "translate"))) return;

    try {

      /* -----------------------------------------------
         API KEY CHECK
         ----------------------------------------------- */

      if (!openai) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured."

        });

      }


      /* -----------------------------------------------
         INPUT
         ----------------------------------------------- */

      const text =
        cleanText(
          req.body?.text
        );

      const source =
        cleanText(
          req.body?.source || "en"
        );

      const target =
        cleanText(
          req.body?.target || "hi"
        );


      /* -----------------------------------------------
         VALIDATION
         ----------------------------------------------- */

      if (!text) {

        return res.status(400).json({

          error:
            "text is required"

        });

      }


      if (text.length > 12000) {

        return res.status(400).json({

          error:
            "text is too long"

        });

      }


      if (
        source !== "en" ||
        target !== "hi"
      ) {

        return res.status(400).json({

          error:
            "Only English to Hindi translation is enabled."

        });

      }


      /* -----------------------------------------------
         OPENAI TRANSLATION
         ----------------------------------------------- */

      const response =
        await openai.responses.create({

          model:
            MODEL,

          input: [

            {
              role:
                "system",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    `
You are an expert UPSC bilingual editor.

Translate the supplied UPSC Civil Services Examination
question from English to natural, precise Hindi.

STRICT RULES:

1. Preserve the exact meaning.
2. Preserve the exact demand of the question.
3. Preserve directive words such as:
   Discuss, Examine, Analyse, Evaluate,
   Critically Examine, Assess, Comment,
   Explain, Compare, Differentiate, etc.
4. Do not summarize.
5. Do not explain.
6. Do not answer the question.
7. Do not add facts.
8. Do not remove information.
9. Preserve names, dates, places and institutions.
10. Preserve constitutional/legal terminology.
11. Preserve technical terminology.
12. Preserve numbering and structure.
13. Use natural UPSC-level Hindi.
14. Where useful, retain standard English terms
    in parentheses.

Examples:

Discuss
→ विवेचना कीजिए

Examine
→ परीक्षण कीजिए

Analyse
→ विश्लेषण कीजिए

Critically Examine
→ आलोचनात्मक परीक्षण कीजिए

Evaluate
→ मूल्यांकन कीजिए

Assess
→ आकलन कीजिए

Comment
→ टिप्पणी कीजिए

Explain
→ स्पष्ट कीजिए

Compare
→ तुलना कीजिए

Differentiate
→ अंतर स्पष्ट कीजिए

Output ONLY the Hindi translation.
                    `.trim()

                }

              ]

            },


            {
              role:
                "user",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    text

                }

              ]

            }

          ]

        });


      /* -----------------------------------------------
         OUTPUT
         ----------------------------------------------- */

      const translation =
        cleanText(
          response.output_text
        );


      if (!translation) {

        return res.status(502).json({

          error:
            "Translation returned empty output."

        });

      }


      res.json({

        translation:
          translation

      });


    } catch (error) {

      console.error(
        "/api/translate error:",
        error
      );


      res.status(500).json({

        error:
          "Translation failed",

        detail:
          error?.message ||
          "Unknown error"

      });

    }

  }
);


/* =========================================================
   FATEH27
   AI ANSWER EVALUATION
   ========================================================= */

app.post(
  "/api/evaluate",
  rateLimit("evaluate", RATE_LIMITS.evaluate),
  async (req, res) => {
    if (!(await enforceDailyAiQuota(req, res, "evaluate"))) return;

    try {

      /* -----------------------------------------------
         API KEY CHECK
         ----------------------------------------------- */

      if (!openai) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured."

        });

      }


      /* -----------------------------------------------
         INPUT
         ----------------------------------------------- */

      const {

        exam =
          "UPSC CSE",

        paper =
          "GS2",

        marks =
          10,

        question =
          "",

        answer =
          "",

        image =
          null,

        imageData =
          null,

        images =
          null,

        language =
          "English"

      } =
        req.body || {};


      /* -----------------------------------------------
         VALIDATION
         ----------------------------------------------- */

      if (
        !cleanText(question)
      ) {

        return res.status(400).json({

          error:
            "question is required"

        });

      }


      const evaluationImages = Array.isArray(images)
        ? images.filter(Boolean)
        : [];

      const evaluationImage =
        image ||
        imageData ||
        evaluationImages[0] ||
        null;

      if (
        !cleanText(answer) &&
        !evaluationImage &&
        !evaluationImages.length
      ) {

        return res.status(400).json({

          error:
            "answer or image is required"

        });

      }


      /* -----------------------------------------------
         SYSTEM PROMPT
         ----------------------------------------------- */

      const systemPrompt = `

You are an expert UPSC Civil Services
Mains evaluator.

Evaluate the candidate answer strictly
according to UPSC-style expectations.

Do not invent facts.

If an image is supplied,
read the handwriting carefully.

Return ONLY valid JSON matching
the supplied schema.

Use ${language} for the feedback
where practical.

Paper:
${paper}

Marks:
${marks}

Exam:
${exam}

Evaluate:

1. Question demand
2. Content accuracy
3. Demand coverage
4. Structure
5. Dimensions
6. Examples
7. Data
8. Conceptual clarity
9. Introduction
10. Conclusion
11. Presentation
12. Overall UPSC suitability

Give actionable improvements.

`.trim();


      /* -----------------------------------------------
         USER PROMPT
         ----------------------------------------------- */

      const userText = `

QUESTION:

${question}


CANDIDATE ANSWER:

${
  answer ||
  "[Answer supplied as handwritten image]"
}


Evaluate the answer carefully.

Give:

• likely marks
• demand coverage
• strengths
• weaknesses
• missing points
• structure feedback
• factual accuracy
• examples/data assessment
• introduction feedback
• conclusion feedback
• improvement plan
• model answer skeleton
• examiner note

`.trim();


      /* -----------------------------------------------
         CONTENT
         ----------------------------------------------- */

      const content = [

        {

          type:
            "input_text",

          text:
            userText

        }

      ];


      /* -----------------------------------------------
         HANDWRITTEN IMAGE
         ----------------------------------------------- */

      /* Accept one or many handwritten pages. */
      const imageList = evaluationImages.length
        ? evaluationImages
        : (evaluationImage ? [evaluationImage] : []);

      for (const imageDataUrl of imageList) {
        content.push({
          type: "input_image",
          image_url: imageDataUrl
        });
      }


      /* -----------------------------------------------
         OPENAI EVALUATION
         ----------------------------------------------- */

      const response =
        await openai.responses.create({

          model:
            MODEL,

          input: [

            {

              role:
                "system",

              content: [

                {

                  type:
                    "input_text",

                  text:
                    systemPrompt

                }

              ]

            },


            {

              role:
                "user",

              content:
                content

            }

          ],


          text: {

            format: {

              type:
                "json_schema",

              name:
                "upsc_answer_evaluation",

              strict:
                true,

              schema: {

                type:
                  "object",

                additionalProperties:
                  false,


                properties: {

                  score: {

                    type:
                      "number"

                  },


                  max_score: {

                    type:
                      "number"

                  },


                  verdict: {

                    type:
                      "string"

                  },


                  demand_coverage: {

                    type:
                      "string"

                  },


                  strengths: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  weaknesses: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  missing_points: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  structure_feedback: {

                    type:
                      "string"

                  },


                  factual_accuracy: {

                    type:
                      "string"

                  },


                  examples_data: {

                    type:
                      "string"

                  },


                  introduction_feedback: {

                    type:
                      "string"

                  },


                  conclusion_feedback: {

                    type:
                      "string"

                  },


                  improvement_plan: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  model_answer_skeleton: {

                    type:
                      "array",

                    items: {

                      type:
                        "string"

                    }

                  },


                  examiner_note: {

                    type:
                      "string"

                  }

                },


                required: [

                  "score",

                  "max_score",

                  "verdict",

                  "demand_coverage",

                  "strengths",

                  "weaknesses",

                  "missing_points",

                  "structure_feedback",

                  "factual_accuracy",

                  "examples_data",

                  "introduction_feedback",

                  "conclusion_feedback",

                  "improvement_plan",

                  "model_answer_skeleton",

                  "examiner_note"

                ]

              }

            }

          }

        });


      /* -----------------------------------------------
         PARSE RESULT
         ----------------------------------------------- */

      let result;


      try {

        result =
          JSON.parse(
            response.output_text
          );

      } catch {

        return res.status(502).json({

          error:
            "Evaluator returned invalid JSON.",

          raw:
            response.output_text

        });

      }


      /* -----------------------------------------------
         SEND RESULT
         ----------------------------------------------- */

      res.json({
        success: true,
        evaluation: {
          estimated_score: result.score,
          score_out_of: result.max_score,
          score_label: result.verdict,
          question_demand: result.demand_coverage,
          content: result.structure_feedback,
          structure: result.structure_feedback,
          analysis: result.demand_coverage,
          examples: result.examples_data,
          strengths: result.strengths,
          missing_points: result.missing_points,
          weak_areas: result.weaknesses,
          improvements: result.improvement_plan,
          better_structure: result.model_answer_skeleton.join("\n"),
          model_answer_direction: result.model_answer_skeleton.join("\n"),
          examiner_note: result.examiner_note,
          word_count_comment: result.factual_accuracy,
          final_verdict: result.verdict
        },
        meta: {
          subject: paper,
          marks: marks
        }
      });


    } catch (error) {

      console.error(
        "/api/evaluate error:",
        error
      );


      res.status(500).json({

        error:
          "Evaluation failed",

        detail:
          error?.message ||
          "Unknown error"

      });

    }

  }
);


/* =========================================================
   FATEH27
   AI SECRETARY
   ========================================================= */

function normalizeSecretaryPlan(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).slice(0, 100).map((item) => ({
    id: item?.id ?? null,
    text: cleanText(item?.text),
    done: Boolean(item?.done)
  })).filter((item) => item.text);
}

function normalizeSecretaryList(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean).slice(0, 50);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function secretaryFallback(message, plan, progress, revisionDue) {
  const pending = plan.filter((item) => !item.done);
  const completed = plan.filter((item) => item.done);
  const lower = message.toLowerCase();

  if (lower.includes("bacha") || lower.includes("pending") || lower.includes("remaining")) {
    if (!pending.length) return "Aaj ke Today Plan mein koi pending task nahi hai.";
    return "Aaj " + pending.length + " task pending hain: " + pending.map((item) => item.text).join(", ") + ".";
  }

  if (lower.includes("revision") || lower.includes("revise")) {
    if (revisionDue > 0) return "Revision queue mein " + revisionDue + " item due hain.";
    return "Abhi revision queue mein koi due item report nahi hua hai.";
  }

  if (lower.includes("status") || lower.includes("progress")) {
    return "Today Plan mein " + completed.length + " complete aur " + pending.length + " pending hain. Total solved: " + (Number(progress?.solved) || 0) + ".";
  }

  return "Main tumhare Today Plan, completed work, pending tasks aur revision status ke basis par help kar sakta hoon.";
}

app.post(
  "/api/secretary",
  rateLimit("secretary", RATE_LIMITS.secretary),
  async (req, res) => {
    if (!(await enforceDailyAiQuota(req, res, "secretary"))) return;
    try {
      const message = cleanText(req.body?.message);

      if (!message) return res.status(400).json({ error: "message is required" });
      if (message.length > 4000) return res.status(400).json({ error: "message is too long" });

      const plan = normalizeSecretaryPlan(req.body?.plan || req.body?.todayPlan);
      const progress = req.body?.progress && typeof req.body.progress === "object" ? req.body.progress : {};
      const revisionItems = normalizeSecretaryList(req.body?.revisionItems || req.body?.revisionDueItems);
      const revisionDue = Number.isFinite(Number(req.body?.revisionDue)) ? Math.max(0, Number(req.body.revisionDue)) : revisionItems.length;
      const pyqActivity = normalizeSecretaryList(req.body?.pyqActivity);
      const currentAffairsActivity = normalizeSecretaryList(req.body?.currentAffairsActivity);
      const recentStudyActivity = normalizeSecretaryList(req.body?.recentStudyActivity || req.body?.recentActivity);
      const lastActivity = cleanText(req.body?.lastActivity);

      const pending = plan.filter((item) => !item.done);
      const completed = plan.filter((item) => item.done);

      const context = {
        todayPlan: plan,
        pendingTasks: pending,
        completedTasks: completed,
        progress: {
          xp: Number(progress?.xp) || 0,
          streak: Number(progress?.streak) || 0,
          solved: Number(progress?.solved) || 0,
          gs1: Number(progress?.gs1) || 0,
          gs2: Number(progress?.gs2) || 0,
          gs3: Number(progress?.gs3) || 0,
          gs4: Number(progress?.gs4) || 0
        },
        revisionDue,
        revisionItems,
        pyqActivity,
        currentAffairsActivity,
        recentStudyActivity,
        lastActivity
      };

      if (!openai) {
        const reply = secretaryFallback(message, plan, context.progress, revisionDue);
        return res.json({ reply, ttsText: reply, source: "local-fallback" });
      }

      const systemPrompt = [
        "You are ASTRA PARTH, the FATEH27 AI Secretary for a UPSC aspirant.",
        "",
        "USER AGENCY:",
        "- The user decides priorities.",
        "- Never force a schedule.",
        "- Never tell the user that one task must be done unless the user explicitly chose that priority.",
        "- You may offer optional next actions using language such as \"Agar chaho...\" or \"Optional next step...\".",
        "",
        "DATA INTEGRITY:",
        "- Use ONLY the supplied user data.",
        "- Never invent completed work, pending work, revision due, PYQ activity, Current Affairs activity, study activity, scores, or weak areas.",
        "- Say that data is unavailable when it is not supplied.",
        "- Call an area \"weak\" only when supplied activity/performance data actually supports that conclusion.",
        "- Do not treat the presence of a task as proof that it was studied.",
        "- Distinguish planned, completed, and activity data.",
        "",
        "RESPONSE STYLE:",
        "- Answer in concise natural Hindi/Hinglish matching the user language.",
        "- Prefer 2-6 short sentences or compact bullets.",
        "- For \"Aaj kya bacha hai?\", list pending Today Plan tasks first.",
        "- For revision questions, use the supplied revision data.",
        "- For status questions, separate completed and pending counts.",
        "- Mention PYQ or Current Affairs activity only when relevant and actually supplied.",
        "- Do not mention APIs, prompts, hidden implementation details, or JSON.",
        "- Do not claim memory beyond the data supplied in this request.",
        "",
        "CURRENT USER DATA:",
        JSON.stringify(context)
      ].join("\n");

      const response = await openai.responses.create({
        model: MODEL,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: message }] }
        ]
      });

      const reply = cleanText(response.output_text);
      if (!reply) return res.status(502).json({ error: "Secretary returned empty output." });

      return res.json({ reply, ttsText: reply, source: "openai" });

    } catch (error) {
      console.error("/api/secretary error:", error);
      res.status(500).json({
        error: "Secretary request failed",
        detail: error?.message || "Unknown error"
      });
    }
  }
);

/* =========================================================
   AI SECRETARY TEXT-TO-SPEECH
   ========================================================= */

app.post(
  "/api/secretary/tts",
  rateLimit("tts", RATE_LIMITS.tts),
  async (req, res) => {
    if (!(await enforceDailyAiQuota(req, res, "tts"))) return;
    try {
      if (!openai) {
        return res.status(500).json({
          error: "OPENAI_API_KEY is not configured."
        });
      }

      const text = cleanText(req.body?.text);

      if (!text) {
        return res.status(400).json({
          error: "text is required"
        });
      }

      if (text.length > 4096) {
        return res.status(400).json({
          error: "text is too long for speech generation"
        });
      }

      const speech = await openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "marin",
        input: text,
        instructions: "Speak naturally in clear Indian Hindi/Hinglish. Calm, concise and helpful study-assistant tone.",
        response_format: "mp3",
        speed: 0.95
      });

      const buffer = Buffer.from(await speech.arrayBuffer());

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store"
      });

      return res.send(buffer);

    } catch (error) {
      console.error("/api/secretary/tts error:", error);

      return res.status(500).json({
        error: "Speech generation failed",
        detail: error?.message || "Unknown error"
      });
    }
  }
);

/* =========================================================
   ACCESS CONTROL / OWNER ADMIN
   =========================================================
   Render runs server.js directly, so the Vercel-style api/access.js
   handler must be mounted explicitly here as an Express route.
   ========================================================= */

app.all(
  "/api/access",
  (req, res) => accessHandler(req, res)
);


/* =========================================================
   STATIC FRONTEND
   ========================================================= */

app.use(
  express.static(
    __dirname
  )
);


/* =========================================================
   SPA FALLBACK
   ========================================================= */

app.get(
  "*",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =========================================================
   SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `FATEH27 backend running on port ${PORT}`
    );

  }
);