export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stripe-webhook" && request.method === "POST") {
      const raw = await request.text();
      const sig = request.headers.get("stripe-signature") || "";

      // 1) 驗證 Stripe 簽名
      const ok = await verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET, sig, raw);
      if (!ok) return json({ error: "Invalid signature" }, 400);

      // 2) 解析事件
      const event = JSON.parse(raw);
      if (event.type !== "checkout.session.completed") {
        console.log("Stripe event received:", event.type);
        return json({ received: true });
      }

      let session = event.data?.object || {};
      // 3) 可選：向 Stripe 取完整 Session（含 line_items）
      if (env.STRIPE_SECRET_KEY) {
        try {
          const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}?expand[]=${encodeURIComponent("line_items")}`, {
            headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
          });
          if (r.ok) session = await r.json();
        } catch (e) {
          console.warn("Stripe fetch session failed:", e);
        }
      }

      // 4) 以 email 建立/更新 Firestore：users_by_email/{emailDocId}
      const email = session.customer_details?.email;
      console.log("checkout.session.completed email:", email, "session:", session.id);
      if (!email) return json({ error: "No customer email" }, 400);

      const emailDocId = toBase64Url(email); // 用 base64url 當 docId，避免 @/. 等字元
      const projectId = env.GCP_PROJECT_ID;

      // 準備寫入：+1 credits、isPaid=true、payments arrayUnion、lastPaymentDate=SERVER_TIME
      const paymentEntry = mapValue({
        sessionId: session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || "usd",
        status: "completed",
        createdAt: new Date().toISOString()
      });

      const writes = [
        // 先 upsert email 欄位（確保文件存在）
        updateWrite(`projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`, {
          email: { stringValue: email }
        }, ["email"]),
        // 變更：credits +1、lastPaymentDate=REQUEST_TIME、payments arrayUnion
        {
          transform: {
            document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            fieldTransforms: [
              { fieldPath: "credits", increment: { integerValue: "1" } },
              { fieldPath: "lastPaymentDate", setToServerValue: "REQUEST_TIME" },
              { fieldPath: "isPaid", setToServerValue: "REQUEST_TIME" } // 用 REQUEST_TIME 先標記存在，後續再 true
            ]
          }
        },
        // 將 isPaid 改為 true（用 update 合併）
        updateWrite(`projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`, {
          isPaid: { booleanValue: true }
        }, ["isPaid"]),
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

      try {
        const token = await getGcpAccessToken(env);
        const resp = await firestoreCommit(projectId, token, writes);
        console.log("Firestore commit ok:", JSON.stringify(resp).slice(0,200));
        return json({ ok: true });
      } catch (e) {
        console.error("Firestore commit error:", e);
        return json({ error: "Firestore error" }, 500);
      }
    }

    if (url.pathname === "/api/calendly-webhook" && request.method === "POST") {
      const raw = await request.text();

      // 暫時停用簽名驗證（Calendly API 不提供 signing key）
      /*
      const calSig = request.headers.get("x-cal-signature") || "";
      if (env.CALENDLY_SIGNING_KEY) {
        const ok = await verifyCalendlySignature(env.CALENDLY_SIGNING_KEY, calSig, raw);
        if (!ok) return json({ error: "Invalid Calendly signature" }, 401);
      }
      */

      const body = JSON.parse(raw || "{}");
      if (body.event !== "invitee.created") return json({ received: true });

      const inviteeEmail =
        body?.payload?.invitee?.email ||
        body?.payload?.email ||
        body?.payload?.invitee_email;

      if (!inviteeEmail) return json({ error: "No invitee email" }, 400);

      const emailDocId = toBase64Url(inviteeEmail);
      const projectId = env.GCP_PROJECT_ID;

      const bookingEntry = mapValue({
        calendlyEventUri: body?.payload?.event || "",
        createdAt: new Date().toISOString()
      });

      // 寫入：credits -1、bookings arrayUnion
      const writes = [
        updateWrite(`projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`, {
          email: { stringValue: inviteeEmail }
        }, ["email"]),
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

      try {
        const token = await getGcpAccessToken(env);
        await firestoreCommit(projectId, token, writes);
        return json({ ok: true });
      } catch (e) {
        console.error("Firestore commit error:", e);
        return json({ error: "Firestore error" }, 500);
      }
    }

    return new Response("OK");
  }
};

/* -------------------- Stripe/Calendly 驗證 -------------------- */

async function verifyStripeSignature(secret, header, rawBody, tolerance = 300) {
  try {
    const parts = parseSigHeader(header); // { t: "...", v1: ["..."] }
    if (!parts.t || !parts.v1?.length) return false;

    const timestamp = parseInt(parts.t, 10);
    if (!Number.isFinite(timestamp)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) return false;

    const payload = `${timestamp}.${rawBody}`;
    const mac = await hmacSha256Hex(secret, payload);
    return parts.v1.some((sig) => timingSafeEqualHex(mac, sig));
  } catch {
    return false;
  }
}

async function verifyCalendlySignature(signingKey, header, rawBody) {
  try {
    // 解析 t 與 v1；Calendly 的計算方式與 Stripe 類似：sign(`${t}.${rawBody}`)
    const parts = parseSigHeader(header);
    if (!parts.t || !parts.v1?.length) return false;
    const payload = `${parts.t}.${rawBody}`;
    const mac = await hmacSha256Hex(signingKey, payload);
    return parts.v1.some((sig) => timingSafeEqualHex(mac, sig));
  } catch {
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

/* -------------------- Firestore via OAuth2(Service Account) -------------------- */

async function getGcpAccessToken(env) {
  // 以服務帳戶簽發 JWT，換取 OAuth2 access_token（scope: datastore）
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.GOOGLE_CLIENT_EMAIL,
    sub: env.GOOGLE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat, exp
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
  if (!r.ok) throw new Error("Token exchange failed");
  const res = await r.json();
  return res.access_token;
}

async function signJwtRS256(header, payload, pemPrivateKey) {
  const enc = new TextEncoder();
  const base64url = (s) =>
    b64urlEncode(enc.encode(typeof s === "string" ? s : JSON.stringify(s)));

  const input = `${base64url(header)}.${base64url(payload)}`;

  const key = await importPkcs8PrivateKey(pemPrivateKey, "RSASSA-PKCS1-v1_5");
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    enc.encode(input)
  );

  return `${input}.${b64urlEncode(new Uint8Array(sig))}`;
}

async function importPkcs8PrivateKey(pem, algorithm) {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const raw = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: algorithm, hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function b64urlEncode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toBase64Url(str) {
  return b64urlEncode(new TextEncoder().encode(str));
}

/* -------------------- Firestore commit helper -------------------- */

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
    throw new Error(`Commit failed: ${err}`);
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
  // 只處理常用型別：string/number/boolean/ISO8601
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      // 判斷是否 ISO timestamp
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