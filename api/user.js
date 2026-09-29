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
  if (!hash) throw new Error("Telegram initData hash is missing");

  const authDate = Number(params.get("auth_date"));
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

  const rawUser = params.get("user");
  if (!rawUser) throw new Error("Telegram user data is missing");

  const user = JSON.parse(rawUser);
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

  const base64url = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64")
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsigned = base64url({ alg: "RS256", typ: "JWT" }) + "." + base64url({
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

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Google OAuth failed: " + detail.slice(0, 500));
  }

  return (await response.json()).access_token;
}

function firestoreValue(value) {
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isFinite(value)) {
    return { integerValue: String(Math.trunc(value)) };
  }
  return { stringValue: clean(value) };
}

async function readUserDocument(user) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();
  const documentId = String(user.id);

  const url = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(projectId) +
    "/databases/(default)/documents/users/" + encodeURIComponent(documentId);

  const response = await fetch(url, {
    headers: { authorization: "Bearer " + token }
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Firestore user read failed: " + detail.slice(0, 500));
  }

  return await response.json();
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

function parseStoredProgress(fields) {
  try {
    const raw = fromFirestoreValue(fields?.progressJson);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function mergeProgress(existing, incoming) {
  const oldProgress = existing && typeof existing === "object" ? existing : {};
  const newProgress = incoming && typeof incoming === "object" ? incoming : {};

  return {
    ...oldProgress,
    ...newProgress,
    xp: Math.max(Number(oldProgress.xp) || 0, Number(newProgress.xp) || 0),
    streak: Math.max(Number(oldProgress.streak) || 0, Number(newProgress.streak) || 0),
    solved: Math.max(Number(oldProgress.solved) || 0, Number(newProgress.solved) || 0),
    gs1: Math.max(Number(oldProgress.gs1) || 0, Number(newProgress.gs1) || 0),
    gs2: Math.max(Number(oldProgress.gs2) || 0, Number(newProgress.gs2) || 0),
    gs3: Math.max(Number(oldProgress.gs3) || 0, Number(newProgress.gs3) || 0),
    gs4: Math.max(Number(oldProgress.gs4) || 0, Number(newProgress.gs4) || 0),
    done: { ...(oldProgress.done || {}), ...(newProgress.done || {}) },
    badges: [...new Set([...(oldProgress.badges || []), ...(newProgress.badges || [])])],
    lastActivity: newProgress.lastActivity || oldProgress.lastActivity || ""
  };
}

async function writeUserDocument(user, body) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();
  const documentId = String(user.id);

  const profile = body?.profile && typeof body.profile === "object" ? body.profile : {};
  const incomingProgress = profile.progress && typeof profile.progress === "object"
    ? profile.progress
    : {};

  const existingDocument = await readUserDocument(user);
  const existingFields = existingDocument?.fields || {};
  const existingPlan = fromFirestoreValue(existingFields.plan);
  const plan = existingPlan || "free";
  const progress = mergeProgress(parseStoredProgress(existingFields), incomingProgress);
  const now = new Date().toISOString();

  const fields = {
    telegramId: firestoreValue(user.id),
    firstName: firestoreValue(user.first_name),
    lastName: firestoreValue(user.last_name),
    username: firestoreValue(user.username),
    languageCode: firestoreValue(user.language_code),
    isPremiumTelegram: firestoreValue(Boolean(user.is_premium)),
    plan: firestoreValue(plan),
    xp: firestoreValue(progress.xp || 0),
    streak: firestoreValue(progress.streak || 0),
    solved: firestoreValue(progress.solved || 0),
    gs1: firestoreValue(progress.gs1 || 0),
    gs2: firestoreValue(progress.gs2 || 0),
    gs3: firestoreValue(progress.gs3 || 0),
    gs4: firestoreValue(progress.gs4 || 0),
    progressJson: firestoreValue(JSON.stringify(progress)),
    lastActivity: firestoreValue(profile.lastActivity || now),
    updatedAt: firestoreValue(now)
  };

  const activity = body?.activity && typeof body.activity === "object" ? body.activity : {};
  const activityFields = {
    type: firestoreValue(activity.type || "dashboard_open"),
    module: firestoreValue(activity.module || "dashboard"),
    metadata: firestoreValue(JSON.stringify(activity.metadata || {})),
    createdAt: firestoreValue(now)
  };

  const userUrl = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(projectId) +
    "/databases/(default)/documents/users/" + encodeURIComponent(documentId);

  const response = await fetch(userUrl, {
    method: "PATCH",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Firestore user write failed: " + detail.slice(0, 500));
  }

  const activityUrl = userUrl + "/activity";
  const activityResponse = await fetch(activityUrl, {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: JSON.stringify({ fields: activityFields })
  });

  if (!activityResponse.ok) {
    const detail = await activityResponse.text();
    throw new Error("Firestore activity write failed: " + detail.slice(0, 500));
  }

  return {
    id: documentId,
    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    username: user.username || null,
    plan,
    syncedAt: now,
    progress
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const initData = clean(req.headers["x-telegram-init-data"]);
    if (!initData) {
      return res.status(401).json({ error: "Telegram authentication is required" });
    }

    const user = verifyTelegramInitData(initData);
    const result = await writeUserDocument(user, req.body || {});

    return res.status(200).json({
      success: true,
      user: result
    });
  } catch (error) {
    console.error("/api/user error:", error);
    const message = error?.message || "User sync failed";

    return res.status(
      /authentication|signature|initData|Telegram user/i.test(message) ? 401 : 500
    ).json({
      error: "User sync failed",
      detail: message
    });
  }
}
