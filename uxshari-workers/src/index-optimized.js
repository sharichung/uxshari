/**
 * 🎯 UXShari Stripe/Calendly Webhook Handler
 * 優化版：完整日誌、錯誤處理、Firestore 整合
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ============================================================
    // 🔵 Stripe Webhook：付款成功 → +1 預約額度
    // ============================================================
    if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
      const raw = await request.text();
      const sig = request.headers.get("stripe-signature") || "";

      console.log("📨 Stripe webhook received");

      // 1️⃣ 驗證簽名
      const verified = await verifyStripeSignature(
        env.STRIPE_WEBHOOK_SECRET,
        sig,
        raw,
        env.SKIP_STRIPE_SIG_CHECK === "1" ? 999999 : 600
      );

      if (!verified && env.SKIP_STRIPE_SIG_CHECK !== "1") {
        console.error("❌ Stripe signature verification failed");
        return json({ error: "Invalid signature" }, 400);
      }

      // 2️⃣ 解析事件
      const event = JSON.parse(raw);
      console.log(`📋 Event type: ${event.type}`);

      if (event.type !== "checkout.session.completed") {
        return json({ received: true });
      }

      // 3️⃣ 取得 Session 詳細資料
      let session = event.data?.object || {};
      
      // 可選：向 Stripe API 取得完整 Session（包含 line_items）
      if (env.STRIPE_SECRET_KEY) {
        try {
          const expandUrl = `https://api.stripe.com/v1/checkout/sessions/${session.id}?expand[]=line_items`;
          const resp = await fetch(expandUrl, {
            headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
          });
          if (resp.ok) session = await resp.json();
        } catch (e) {
          console.warn("⚠️ Failed to expand session:", e.message);
        }
      }

      const email = session.customer_details?.email;
      const amount = (session.amount_total || 0) / 100;
      const currency = session.currency || "usd";

      if (!email) {
        console.error("❌ No customer email in session");
        return json({ error: "No customer email" }, 400);
      }

      console.log(`✅ Payment successful: ${email} paid ${currency} ${amount}`);

      // 4️⃣ 更新 Firestore
      try {
        const emailDocId = toBase64Url(email);
        const projectId = env.GCP_PROJECT_ID;

        const paymentEntry = mapValue({
          sessionId: session.id,
          amount,
          currency,
          status: "completed",
          createdAt: new Date().toISOString()
        });

        const writes = [
          // 確保文件存在
          updateWrite(
            `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            { email: { stringValue: email } },
            ["email"]
          ),
          // credits +1, isPaid = true, lastPaymentDate = SERVER_TIME
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                { fieldPath: "credits", increment: { integerValue: "1" } },
                { fieldPath: "lastPaymentDate", setToServerValue: "REQUEST_TIME" }
              ]
            }
          },
          updateWrite(
            `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            { isPaid: { booleanValue: true } },
            ["isPaid"]
          ),
          // payments arrayUnion
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                {
                  fieldPath: "payments",
                  appendMissingElements: { arrayValue: { values: [paymentEntry] } }
                }
              ]
            }
          }
        ];

        const token = await getGcpAccessToken(env);
        await firestoreCommit(projectId, token, writes);

        console.log(`🎉 Firestore updated: ${email} now has +1 credit`);
        return json({ ok: true, email, creditsAdded: 1 });

      } catch (e) {
        console.error("❌ Firestore error:", e.message);
        return json({ error: "Firestore update failed", details: e.message }, 500);
      }
    }

    // ============================================================
    // 🟢 Calendly Webhook：預約完成 → -1 預約額度
    // ============================================================
    if (url.pathname === "/api/calendly-webhook" && request.method === "POST") {
      const raw = await request.text();

      console.log("📨 Calendly webhook received");

      // 可選：驗證簽名（需設定 CALENDLY_SIGNING_KEY）
      if (env.CALENDLY_SIGNING_KEY) {
        const calSig = request.headers.get("x-cal-signature") || "";
        const verified = await verifyCalendlySignature(env.CALENDLY_SIGNING_KEY, calSig, raw);
        if (!verified) {
          console.error("❌ Calendly signature verification failed");
          return json({ error: "Invalid signature" }, 401);
        }
      }

      const body = JSON.parse(raw || "{}");
      console.log(`📋 Calendly event: ${body.event}`);

      if (body.event !== "invitee.created") {
        return json({ received: true });
      }

      const inviteeEmail =
        body?.payload?.invitee?.email ||
        body?.payload?.email ||
        body?.payload?.invitee_email;

      if (!inviteeEmail) {
        console.error("❌ No invitee email");
        return json({ error: "No invitee email" }, 400);
      }

      console.log(`✅ Booking confirmed: ${inviteeEmail}`);

      // 更新 Firestore：credits -1
      try {
        const emailDocId = toBase64Url(inviteeEmail);
        const projectId = env.GCP_PROJECT_ID;

        const bookingEntry = mapValue({
          calendlyEventUri: body?.payload?.event || "",
          createdAt: new Date().toISOString()
        });

        const writes = [
          updateWrite(
            `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            { email: { stringValue: inviteeEmail } },
            ["email"]
          ),
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                { fieldPath: "credits", increment: { integerValue: "-1" } }
              ]
            }
          },
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                {
                  fieldPath: "bookings",
                  appendMissingElements: { arrayValue: { values: [bookingEntry] } }
                }
              ]
            }
          }
        ];

        const token = await getGcpAccessToken(env);
        await firestoreCommit(projectId, token, writes);

        console.log(`🎉 Firestore updated: ${inviteeEmail} used 1 credit`);
        return json({ ok: true, email: inviteeEmail, creditsDeducted: 1 });

      } catch (e) {
        console.error("❌ Firestore error:", e.message);
        return json({ error: "Firestore update failed", details: e.message }, 500);
      }
    }

    // ============================================================
    // 🔵 Health Check
    // ============================================================
    if (url.pathname === "/health") {
      return json({ status: "ok", timestamp: new Date().toISOString() });
    }

    return new Response("UXShari Webhook Handler", { status: 200 });
  }
};

/* ========================================
   🔐 Stripe/Calendly 簽名驗證
======================================== */

async function verifyStripeSignature(secret, header, rawBody, tolerance = 300) {
  try {
    const parts = parseSigHeader(header);
    if (!parts.t || !parts.v1?.length) return false;

    const timestamp = parseInt(parts.t, 10);
    if (!Number.isFinite(timestamp)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      console.warn(`⚠️ Timestamp too old: ${Math.abs(now - timestamp)}s`);
      return false;
    }

    const payload = `${timestamp}.${rawBody}`;
    const mac = await hmacSha256Hex(secret, payload);
    return parts.v1.some((sig) => timingSafeEqualHex(mac, sig));
  } catch (e) {
    console.error("❌ Signature verification error:", e.message);
    return false;
  }
}

async function verifyCalendlySignature(signingKey, header, rawBody) {
  try {
    const parts = parseSigHeader(header);
    if (!parts.t || !parts.v1?.length) return false;
    const payload = `${parts.t}.${rawBody}`;
    const mac = await hmacSha256Hex(signingKey, payload);
    return parts.v1.some((sig) => timingSafeEqualHex(mac, sig));
  } catch (e) {
    console.error("❌ Calendly signature error:", e.message);
    return false;
  }
}

function parseSigHeader(header) {
  const out = { v1: [] };
  for (const seg of header.split(",")) {
    const [k, v] = seg.split("=");
    if (!k || !v) continue;
    const key = k.trim();
    const val = v.trim();
    if (key === "t") out.t = val;
    if (key === "v1") out.v1.push(val);
  }
  return out;
}

async function hmacSha256Hex(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toHex(sigBuf);
}

function toHex(buf) {
  const bytes = new Uint8Array(buf);
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/* ========================================
   🔥 Firestore via OAuth2 (Service Account)
======================================== */

async function getGcpAccessToken(env) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.GOOGLE_CLIENT_EMAIL,
    sub: env.GOOGLE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp
  };

  const jwt = await signJwtRS256(header, claims, env.GOOGLE_PRIVATE_KEY);
  const form = new URLSearchParams();
  form.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  form.set("assertion", jwt);

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const res = await r.json();
  return res.access_token;
}

async function signJwtRS256(header, payload, pemPrivateKey) {
  const enc = new TextEncoder();
  const base64url = (s) =>
    b64urlEncode(enc.encode(typeof s === "string" ? s : JSON.stringify(s)));

  const input = `${base64url(header)}.${base64url(payload)}`;
  const key = await importPkcs8PrivateKey(pemPrivateKey, "RSASSA-PKCS1-v1_5");
  const sig = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, enc.encode(input));

  return `${input}.${b64urlEncode(new Uint8Array(sig))}`;
}

async function importPkcs8PrivateKey(pem, algorithm) {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", raw, { name: algorithm, hash: "SHA-256" }, false, ["sign"]);
}

function b64urlEncode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toBase64Url(str) {
  return b64urlEncode(new TextEncoder().encode(str));
}

/* ========================================
   🔥 Firestore Commit Helper
======================================== */

async function firestoreCommit(projectId, accessToken, writes) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ writes })
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Firestore commit failed: ${err}`);
  }

  return r.json();
}

function updateWrite(docName, fields, fieldPaths) {
  return {
    update: { name: docName, fields },
    updateMask: { fieldPaths }
  };
}

function mapValue(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      if (/^\d{4}-\d{2}-\d{2}T/.test(v)) fields[k] = { timestampValue: v };
      else fields[k] = { stringValue: v };
    } else if (typeof v === "number") {
      if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
      else fields[k] = { doubleValue: v };
    } else if (typeof v === "boolean") {
      fields[k] = { booleanValue: v };
    }
  }
  return { mapValue: { fields } };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
