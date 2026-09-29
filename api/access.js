import crypto from "crypto";

const MAX_AGE_SECONDS = 24 * 60 * 60;

function clean(value) {
  return String(value ?? "").trim();
}

function verifyTelegramInitData(initData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const params = new URLSearchParams(clean(initData));
  const hash = params.get("hash");
  const authDate = Number(params.get("auth_date"));

  if (!hash) throw new Error("Telegram initData hash is missing");
  if (!authDate || Math.abs(Math.floor(Date.now() / 1000) - authDate) > MAX_AGE_SECONDS) {
    throw new Error("Telegram initData has expired");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + "=" + value)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const received = Buffer.from(hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new Error("Invalid Telegram initData signature");
  }

  const user = JSON.parse(params.get("user") || "{}");
  if (!user?.id) throw new Error("Telegram user id is missing");
  return user;
}

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase server credentials are not configured");
  }

  return { projectId, clientEmail, privateKey };
}

async function getGoogleAccessToken() {
  const { clientEmail, privateKey } = getFirebaseConfig();
  const now = Math.floor(Date.now() / 1000);

  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  });

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();

  const signature = signer.sign(privateKey).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" +
      encodeURIComponent(unsigned + "." + signature)
  });

  if (!response.ok) throw new Error("Google OAuth failed");
  return (await response.json()).access_token;
}

function fromFirestoreValue(value) {
  if (!value) return null;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return Boolean(value.booleanValue);
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.stringValue !== undefined) return value.stringValue;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const initData = clean(req.headers["x-telegram-init-data"]);
    if (!initData) {
      return res.status(401).json({ error: "Telegram authentication is required" });
    }

    const telegramUser = verifyTelegramInitData(initData);
    const { projectId } = getFirebaseConfig();
    const token = await getGoogleAccessToken();
    const documentId = encodeURIComponent(String(telegramUser.id));

    const url = "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(projectId) +
      "/databases/(default)/documents/users/" + documentId;

    const response = await fetch(url, {
      headers: { authorization: "Bearer " + token }
    });

    if (response.status === 404) {
      return res.status(200).json({
        authenticated: true,
        plan: "free",
        subscriptionStatus: "free",
        subscriptionEndsAt: null,
        premium: false
      });
    }

    if (!response.ok) {
      throw new Error("Firestore entitlement read failed");
    }

    const document = await response.json();
    const fields = document?.fields || {};
    const plan = fromFirestoreValue(fields.plan) || "free";
    const subscriptionStatus = fromFirestoreValue(fields.subscriptionStatus) || "free";
    const subscriptionEndsAt = fromFirestoreValue(fields.subscriptionEndsAt) || null;

    const activeByDate = !subscriptionEndsAt || new Date(subscriptionEndsAt).getTime() > Date.now();
    const premium = plan === "premium" &&
      subscriptionStatus === "active" &&
      activeByDate;

    return res.status(200).json({
      authenticated: true,
      plan: premium ? "premium" : "free",
      subscriptionStatus: premium ? "active" : subscriptionStatus,
      subscriptionEndsAt,
      premium
    });
  } catch (error) {
    console.error("/api/access error:", error);
    const message = error?.message || "Access check failed";
    return res.status(/authentication|signature|Telegram/i.test(message) ? 401 : 500).json({
      error: "Access check failed",
      detail: message
    });
  }
}
