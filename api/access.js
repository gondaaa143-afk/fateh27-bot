import crypto from "crypto";

const MAX_AGE_SECONDS = 24 * 60 * 60;
const ADMIN_ID = String(process.env.FATEH27_ADMIN_ID || "5496422260");

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

async function firestoreRequest(path, options = {}) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/" + path;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Firestore request failed: " + response.status + " " + detail.slice(0, 300));
  }

  return response.json();
}

function stringValue(value) {
  return { stringValue: clean(value) };
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

async function getAccessState(userId) {
  const id = encodeURIComponent(String(userId));
  const userDoc = await firestoreRequest("users/" + id);
  if (userDoc) {
    return { status: "approved", source: "existing_user" };
  }

  const requestDoc = await firestoreRequest("accessRequests/" + id);
  const status = String(fromFirestoreValue(requestDoc?.fields?.status) || "").toLowerCase();

  if (status === "approved") return { status: "approved", source: "request" };
  if (status === "rejected") return { status: "rejected", source: "request" };
  if (status === "pending") return { status: "pending", source: "request" };

  return { status: "not_requested", source: null };
}

async function notifyAdminAccessRequest(user) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = String(process.env.FATEH27_ADMIN_ID || "5496422260");
  if (!token || !adminId) return;

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown User";
  const username = user.username ? "@" + user.username : "—";
  const text =
    "🔔 FATEH27 Access Request\\n\\n" +
    "Name: " + name + "\\n" +
    "Username: " + username + "\\n" +
    "Telegram ID: " + String(user.id) + "\\n\\n" +
    "Approve / Reject request from the FATEH27 Admin panel.";

  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: adminId, text })
  }).catch(() => {});
}

async function saveAccessRequest(user) {
  const id = encodeURIComponent(String(user.id));
  const existing = await firestoreRequest("accessRequests/" + id);
  const existingStatus = String(fromFirestoreValue(existing?.fields?.status) || "").toLowerCase();

  if (existingStatus === "approved") {
    return { status: "approved" };
  }

  if (existingStatus === "pending") {
    return { status: "pending" };
  }

  const now = new Date().toISOString();
  await firestoreRequest("accessRequests/" + id, {
    method: "PATCH",
    body: {
      fields: {
        telegramId: stringValue(user.id),
        firstName: stringValue(user.first_name || ""),
        lastName: stringValue(user.last_name || ""),
        username: stringValue(user.username || ""),
        languageCode: stringValue(user.language_code || ""),
        photoUrl: stringValue(user.photo_url || ""),
        status: stringValue("pending"),
        requestedAt: { timestampValue: now },
        updatedAt: { timestampValue: now }
      }
    }
  });

  return { status: "pending" };
}

async function requireAdmin(req) {
  const initData = clean(req.headers["x-telegram-init-data"]);
  if (!initData) throw new Error("Telegram authentication is required");
  const user = verifyTelegramInitData(initData);
  if (String(user.id) !== ADMIN_ID) {
    const error = new Error("Admin access required");
    error.statusCode = 403;
    throw error;
  }
  return user;
}

async function listRequests() {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/accessRequests?pageSize=100&orderBy=updatedAt%20desc";

  const response = await fetch(url, {
    headers: { authorization: "Bearer " + token }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Access request list failed: " + detail.slice(0, 300));
  }

  const data = await response.json();
  return (data.documents || []).map((doc) => {
    const f = doc.fields || {};
    return {
      id: doc.name.split("/").pop(),
      telegramId: fromFirestoreValue(f.telegramId),
      firstName: fromFirestoreValue(f.firstName) || "",
      lastName: fromFirestoreValue(f.lastName) || "",
      username: fromFirestoreValue(f.username) || "",
      languageCode: fromFirestoreValue(f.languageCode) || "",
      photoUrl: fromFirestoreValue(f.photoUrl) || "",
      status: fromFirestoreValue(f.status) || "pending",
      requestedAt: fromFirestoreValue(f.requestedAt) || null,
      updatedAt: fromFirestoreValue(f.updatedAt) || null
    };
  });
}

async function updateRequest(userId, status) {
  const id = encodeURIComponent(String(userId));
  const existing = await firestoreRequest("accessRequests/" + id);
  if (!existing) throw new Error("Access request not found");

  const now = new Date().toISOString();
  await firestoreRequest("accessRequests/" + id, {
    method: "PATCH",
    body: {
      updateMask: {
        fieldPaths: ["status", "updatedAt"]
      },
      fields: {
        status: stringValue(status),
        updatedAt: { timestampValue: now }
      }
    }
  });

  return { status };
}

export default async function handler(req, res) {
  try {
    const initData = clean(req.headers["x-telegram-init-data"]);
    if (!initData) {
      return res.status(401).json({ error: "Telegram authentication is required" });
    }

    const user = verifyTelegramInitData(initData);

    if (req.method === "GET") {
      if (String(req.query?.admin || "") === "1") {
        await requireAdmin(req);
        const requests = await listRequests();
        return res.status(200).json({ success: true, requests });
      }

      const state = await getAccessState(user.id);
      return res.status(200).json({
        success: true,
        user: {
          id: String(user.id),
          name: [user.first_name, user.last_name].filter(Boolean).join(" "),
          username: user.username || null
        },
        ...state
      });
    }

    if (req.method === "POST") {
      const action = String(req.body?.action || "request").toLowerCase();

      if (action === "request") {
        const result = await saveAccessRequest(user);
        return res.status(200).json({ success: true, ...result });
      }

      if (action === "approve" || action === "reject") {
        await requireAdmin(req);
        const userId = clean(req.body?.userId);
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const result = await updateRequest(userId, action === "approve" ? "approved" : "rejected");
        return res.status(200).json({ success: true, ...result, userId });
      }

      return res.status(400).json({ error: "Unknown action" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("/api/access error:", error);
    const message = error?.message || "Access control failed";
    return res.status(error?.statusCode || (/authentication|signature|Telegram/i.test(message) ? 401 : 500)).json({
      error: "Access control failed",
      detail: message
    });
  }
}
