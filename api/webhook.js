import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = String(process.env.FATEH27_ADMIN_ID || "5496422260");
const APP_URL = String(
  process.env.PUBLIC_APP_URL || "https://fateh27-bot.vercel.app"
).replace(/\/$/, "");

/* =========================================================
   TELEGRAM
========================================================= */

async function telegram(method, body) {
  if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  return response.json();
}

/* =========================================================
   FIREBASE
========================================================= */

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase server credentials are not configured");
  }

  return {
    projectId,
    clientEmail,
    privateKey
  };
}

async function getGoogleAccessToken() {
  const { clientEmail, privateKey } = getFirebaseConfig();

  const now = Math.floor(Date.now() / 1000);

  const b64 = (value) =>
    Buffer.from(JSON.stringify(value))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsigned =
    b64({
      alg: "RS256",
      typ: "JWT"
    }) +
    "." +
    b64({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600
    });

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();

  const signature = signer
    .sign(privateKey)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body:
        "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" +
        encodeURIComponent(unsigned + "." + signature)
    }
  );

  if (!response.ok) {
    throw new Error("Google OAuth failed");
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Firebase access token missing");
  }

  return data.access_token;
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

function stringValue(value) {
  return {
    stringValue: String(value ?? "")
  };
}

async function firestoreGetAccessRequest(userId) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/accessRequests/" +
    encodeURIComponent(String(userId));

  const response = await fetch(url, {
    headers: {
      authorization: "Bearer " + token
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      "Firestore access request failed: " + response.status
    );
  }

  return response.json();
}

async function getAccessStatus(userId) {
  const requestDoc = await firestoreGetAccessRequest(userId);

  const status = String(
    fromFirestoreValue(requestDoc?.fields?.status) || ""
  ).toLowerCase();

  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";

  if (String(userId) === ADMIN_ID) {
    return "approved";
  }

  return "not_requested";
}

async function createAccessRequest(user) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();

  const userId = String(user.id);
  const now = new Date().toISOString();

  const url =
    "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/accessRequests/" +
    encodeURIComponent(userId);

  const existing = await firestoreGetAccessRequest(userId);

  const existingStatus = String(
    fromFirestoreValue(existing?.fields?.status) || ""
  ).toLowerCase();

  if (existingStatus === "approved") {
    return "approved";
  }

  if (existingStatus === "pending") {
    return "pending";
  }

  const fields = {
    telegramId: stringValue(userId),
    firstName: stringValue(user.first_name || ""),
    lastName: stringValue(user.last_name || ""),
    username: stringValue(user.username || ""),
    languageCode: stringValue(user.language_code || ""),
    photoUrl: stringValue(user.photo_url || ""),
    status: stringValue("pending"),
    requestedAt: {
      timestampValue: now
    },
    updatedAt: {
      timestampValue: now
    }
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      "Access request creation failed: " +
        response.status +
        " " +
        detail.slice(0, 300)
    );
  }

  await notifyAdminAccessRequest(user);

  return "pending";
}

/* =========================================================
   ADMIN NOTIFICATION
========================================================= */

async function notifyAdminAccessRequest(user) {
  if (!BOT_TOKEN || !ADMIN_ID) return;

  const name =
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Unknown User";

  const username = user.username
    ? "@" + user.username
    : "—";

  const text =
    "🔔 FATEH27 Access Request\n\n" +
    "Name: " +
    name +
    "\n" +
    "Username: " +
    username +
    "\n" +
    "Telegram ID: " +
    String(user.id) +
    "\n\n" +
    "Approve / Reject request from the FATEH27 Admin panel.";

  await telegram("sendMessage", {
    chat_id: ADMIN_ID,
    text
  }).catch(() => {});
}

/* =========================================================
   USER NAME
========================================================= */

function getUserName(user) {
  return (
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    "User"
  );
}

async function saveStudyMaterial(message, category) {
  const { projectId } = getFirebaseConfig();
  const token = await getGoogleAccessToken();
  const document = message.document || {};
  const originalName = String(document.file_name || "study-material.pdf").slice(0, 180);
  const caption = String(message.caption || "").slice(0, 500);
  const title = (caption || originalName).slice(0, 240);
  const id = crypto.createHash("sha256")
    .update(String(document.file_id) + ":" + String(message.message_id))
    .digest("hex").slice(0, 32);
  const fields = {
    title: stringValue(title),
    fileName: stringValue(originalName),
    fileId: stringValue(document.file_id || ""),
    mimeType: stringValue(document.mime_type || "application/pdf"),
    fileSize: { integerValue: String(document.file_size || 0) },
    category: stringValue(category),
    uploadedAt: { timestampValue: new Date().toISOString() },
    source: stringValue("telegram-bot"),
    caption: stringValue(caption)
  };
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/databases/(default)/documents/studyMaterials/" + encodeURIComponent(id);
  const response = await fetch(url, {
    method: "PATCH",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ fields })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Study material save failed: " + response.status + " " + detail.slice(0, 200));
  }
  return { id, title, category };
}

/* =========================================================
   WEBHOOK
========================================================= */

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK");
    }

    const update = req.body;

    if (!update) {
      return res.status(200).send("OK");
    }

    /* =====================================================
       CALLBACK BUTTON
    ===================================================== */

    if (update.callback_query) {
      const callback = update.callback_query;
      const user = callback.from;
      const chatId = callback.message?.chat?.id;

      if (
        callback.data === "f27_request_access" &&
        user?.id &&
        chatId
      ) {
        const status = await getAccessStatus(user.id);

        if (status === "approved") {
          await telegram("answerCallbackQuery", {
            callback_query_id: callback.id,
            text: "Access already approved."
          });

          await telegram("sendMessage", {
            chat_id: chatId,
            text: "Your FATEH27 access is already approved.",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Open FATEH27",
                    web_app: {
                      url: APP_URL
                    }
                  }
                ]
              ]
            }
          });

          return res.status(200).send("OK");
        }

        if (status === "pending") {
          await telegram("answerCallbackQuery", {
            callback_query_id: callback.id,
            text: "Request already pending."
          });

          await telegram("sendMessage", {
            chat_id: chatId,
            text:
              "⏳ Tumhari FATEH27 access request already pending hai.\n\n" +
              "Owner approval ka wait karo."
          });

          return res.status(200).send("OK");
        }

        if (status === "rejected") {
          await telegram("answerCallbackQuery", {
            callback_query_id: callback.id,
            text: "Access rejected."
          });

          await telegram("sendMessage", {
            chat_id: chatId,
            text:
              "❌ Tumhari FATEH27 access request approve nahi hui hai."
          });

          return res.status(200).send("OK");
        }

        await createAccessRequest(user);

        await telegram("answerCallbackQuery", {
          callback_query_id: callback.id,
          text: "Access request sent."
        });

        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            "⏳ Access request owner ko bhej di gayi hai.\n\n" +
            "Approval ke baad hi FATEH27 access milega."
        });

        return res.status(200).send("OK");
      }

      return res.status(200).send("OK");
    }

    /* =====================================================
       NORMAL MESSAGE
    ===================================================== */

    if (!update.message) {
      return res.status(200).send("OK");
    }

    const message = update.message;
    const user = message.from;
    const chatId = message.chat?.id;
    const text = String(message.text || "").trim();

    if (!user?.id || !chatId) {
      return res.status(200).send("OK");
    }

    const userId = String(user.id);

    /* =====================================================
       /START
    ===================================================== */

    if (text === "/start" || text.startsWith("/start ")) {

      /* OWNER */

      if (userId === ADMIN_ID) {
        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            "👑 FATEH27 OWNER ACCESS\n\n" +
            "Owner access automatically enabled hai.",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Open FATEH27",
                  web_app: {
                    url: APP_URL
                  }
                }
              ]
            ]
          }
        });

        return res.status(200).send("OK");
      }

      /* CHECK EXISTING STATUS */

      const status = await getAccessStatus(userId);

      /* APPROVED */

      if (status === "approved") {
        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            `👋 Welcome ${getUserName(user)}.\n\n` +
            "Your FATEH27 access is approved.",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Open FATEH27",
                  web_app: {
                    url: APP_URL
                  }
                }
              ]
            ]
          }
        });

        return res.status(200).send("OK");
      }

      /* PENDING */

      if (status === "pending") {
        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            "⏳ FATEH27 access request already pending hai.\n\n" +
            "Owner approval ke baad hi app access milega."
        });

        return res.status(200).send("OK");
      }

      /* REJECTED */

      if (status === "rejected") {
        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            "❌ FATEH27 access approve nahi hua hai.\n\n" +
            "Owner se contact karo."
        });

        return res.status(200).send("OK");
      }

      /* NEW USER */
      // Create the access request immediately on /start so the owner
      // receives it even if the user never taps a second button.
      await createAccessRequest(user);

      await telegram("sendMessage", {
        chat_id: chatId,
        text:
          `🔐 FATEH27 ACCESS\n\n` +
          `Hello ${getUserName(user)}.\n\n` +
          "FATEH27 join karne ke liye owner approval required hai.\n\n" +
          "Access request owner ko bhej di gayi hai.\n\nApproval ke baad FATEH27 open hoga."
      });

      return res.status(200).send("OK");
    }

    /* =====================================================
       NON-START MESSAGE
       UNAPPROVED USERS CANNOT USE GEMINI
    ===================================================== */

    if (userId !== ADMIN_ID) {
      const status = await getAccessStatus(userId);

      if (status !== "approved") {
        await telegram("sendMessage", {
          chat_id: chatId,
          text:
            "🔐 FATEH27 access approval required hai.\n\n" +
            "Pehle /start karke Request Access bhejo."
        });

        return res.status(200).send("OK");
      }
    }

    /* =====================================================
       ADMIN PDF INGESTION
       PDFs are shared into the FATEH27 library. The Hindu
       editorial/newspaper PDFs are routed to Current Affairs.
    ===================================================== */

    if (message.document && userId === ADMIN_ID) {
      const document = message.document;
      const fileName = String(document.file_name || "").toLowerCase();
      const caption = String(message.caption || "").toLowerCase();
      const isPdf = document.mime_type === "application/pdf" || fileName.endsWith(".pdf");
      if (!isPdf) {
        await telegram("sendMessage", { chat_id: chatId, text: "Please send a PDF file. Other file types are not added to the library yet." });
        return res.status(200).send("OK");
      }
      const isHindu = /the hindu|hindu editorial|editorial|newspaper/.test(fileName + " " + caption);
      const saved = await saveStudyMaterial(message, isHindu ? "current-affairs" : "study-material");
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "✅ PDF added to FATEH27.\n\n" + saved.title + "\nSection: " + (saved.category === "current-affairs" ? "Current Affairs" : "Study Material") + "\n\nOpen the dashboard and refresh the section to view it."
      });
      return res.status(200).send("OK");
    }

    if (message.document && userId !== ADMIN_ID) {
      await telegram("sendMessage", { chat_id: chatId, text: "Only the FATEH27 owner can publish PDFs to the shared Study Material library." });
      return res.status(200).send("OK");
    }

    /* =====================================================
       EXISTING GEMINI FUNCTION
    ===================================================== */

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Reply nahi mila.";

    await telegram("sendMessage", {
      chat_id: chatId,
      text: reply
    });

    return res.status(200).send("Done");

  } catch (error) {
    console.error("FATEH27 Telegram webhook error:", error);

    return res.status(500).json({
      ok: false,
      error: "Webhook processing failed"
    });
  }
}
