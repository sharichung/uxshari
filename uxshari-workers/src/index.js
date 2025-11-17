/**
 * 🎯 UXShari Stripe/Calendly Webhook Handler
 * 優化版：完整日誌、錯誤處理、Firestore 整合
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ============================================================
    // 🧪 Self-test endpoint: verify JWT signing and token exchange
    // ============================================================
    if (url.pathname === "/api/self-test") {
      try {
        console.log("🧪 Self-test: starting token fetch");
        const token = await getGcpAccessToken(env);
        console.log("✅ Self-test: token acquired (length)", token?.length || 0);
        return json({ ok: true, tokenPreview: token ? token.substring(0, 12) + "…" : null });
      } catch (e) {
        console.error("❌ Self-test failed:", e.message);
        return json({ ok: false, error: String(e.message) }, 500);
      }
    }

    // ============================================================
    // 🧪 Self-test Firestore write: simple upsert with transforms
    // ============================================================
    if (url.pathname === "/api/self-test-write") {
      try {
        const projectId = env.GCP_PROJECT_ID;
        const email = url.searchParams.get("email") || "stripe@example.com";
        const emailDocId = toBase64Url(email);
        const token = await getGcpAccessToken(env);

        const paymentEntry = mapValue({ test: true, createdAt: new Date().toISOString() });
        const writes = [
          updateWrite(
            `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            { email: { stringValue: email } },
            ["email"]
          ),
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                { fieldPath: "credits", increment: { integerValue: "1" } },
                { fieldPath: "lastTestWrite", setToServerValue: "REQUEST_TIME" }
              ]
            }
          },
          {
            transform: {
              document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              fieldTransforms: [
                { fieldPath: "payments", appendMissingElements: { values: [paymentEntry] } }
              ]
            }
          }
        ];

        await firestoreCommit(projectId, token, writes);
        console.log("✅ Self-test write: success");
        return json({ ok: true, email });
      } catch (e) {
        console.error("❌ Self-test write failed:", e.message);
        return json({ ok: false, error: String(e.message) }, 500);
      }
    }

    // ============================================================
    // 🧪 Self-test booking: decrement credits for a given email
    // Usage: GET /api/self-test-book?email=user@example.com
    // ============================================================
    if (url.pathname === "/api/self-test-book") {
      try {
        const projectId = env.GCP_PROJECT_ID;
        const email = url.searchParams.get("email");
        if (!email) return json({ ok: false, error: "Missing email" }, 400);
        const emailDocId = toBase64Url(email);
        const token = await getGcpAccessToken(env);

        const bookingEntry = mapValue({
          calendlyEventUri: "self-test",
          createdAt: new Date().toISOString()
        });

        const writes = [
          updateWrite(
            `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
            { email: { stringValue: email } },
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
                { fieldPath: "bookings", appendMissingElements: { values: [bookingEntry] } }
              ]
            }
          }
        ];

        await firestoreCommit(projectId, token, writes);
        console.log(`✅ Self-test book: success for ${email}`);
        return json({ ok: true, email, creditsDeducted: 1 });
      } catch (e) {
        console.error("❌ Self-test book failed:", e.message);
        return json({ ok: false, error: String(e.message) }, 500);
      }
    }

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

      // 支援冪等：以 Stripe event.id 建立事件紀錄，避免重覆處理
      const projectId = env.GCP_PROJECT_ID;
      const token = await getGcpAccessToken(env);
      const stripeEventId = event.id;
      const eventDocName = `projects/${projectId}/databases/(default)/documents/events_by_id/stripe_${toBase64Url(stripeEventId)}`;

      if (event.type !== "checkout.session.completed") {
        // 對其他事件先記錄已接收（未做扣點/加點）
        try {
          await firestoreCommit(projectId, token, [
            {
              update: {
                name: eventDocName,
                fields: mapValue({
                  type: event.type,
                  receivedAt: new Date().toISOString()
                }).mapValue.fields
              },
              currentDocument: { exists: false }
            }
          ]);
        } catch (e) {
          // 重送無妨
          console.warn("ℹ️ Stripe non-completed event already recorded or not critical:", e.message);
        }
        return json({ received: true });
      }

      // 3️⃣ 取得 Session 詳細資料
      let session = event.data?.object || {};
      
      // 可選：向 Stripe API 取得完整 Session（包含 line_items 與 receipt_url）
      if (env.STRIPE_SECRET_KEY) {
        try {
          const expandUrl = `https://api.stripe.com/v1/checkout/sessions/${session.id}?expand[]=line_items&expand[]=payment_intent.charges.data`;
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

      // 4️⃣ 更新 Firestore（冪等）
      try {
        const emailDocId = toBase64Url(email);

        const paymentEntry = mapValue({
          sessionId: session.id,
          amount,
          currency,
          status: "completed",
          receiptUrl: session?.payment_intent?.charges?.data?.[0]?.receipt_url || "",
          createdAt: new Date().toISOString()
        });

        const writes = [
          // 事件冪等：若事件已處理，以下寫入會被整體拒絕
          {
            update: {
              name: eventDocName,
              fields: mapValue({
                type: event.type,
                email,
                sessionId: session.id,
                processedAt: new Date().toISOString()
              }).mapValue.fields
            },
            currentDocument: { exists: false }
          },
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
                  appendMissingElements: { values: [paymentEntry] }
                }
              ]
            }
          }
        ];

        await firestoreCommit(projectId, token, writes);

        console.log(`🎉 Firestore updated: ${email} now has +1 credit`);
        return json({ ok: true, email, creditsAdded: 1 });

      } catch (e) {
        const msg = String(e.message || e);
        if (/ALREADY_EXISTS|409/.test(msg)) {
          console.warn(`ℹ️ Stripe event already processed: ${stripeEventId}`);
          return json({ ok: true, alreadyProcessed: true });
        }
        console.error("❌ Firestore error:", e.message);
        return json({ error: "Firestore update failed", details: e.message }, 500);
      }
    }

    // ============================================================
    // � Create Checkout and Redirect
    // GET /api/checkout-redirect?email=...&origin=...
    // 在 Worker 端建立 Stripe Checkout Session，並 302 導向 Stripe
    // 不需在前端暴露 Payment Link 或 Price ID，可用 inline price_data
    // ============================================================
    if (url.pathname === "/api/checkout-redirect" && request.method === "GET") {
      try {
        const email = url.searchParams.get("email");
        const origin = url.searchParams.get("origin") || "https://uxshari.com";
        if (!email) return json({ ok: false, error: "Missing email" }, 400);

        if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Missing STRIPE_SECRET_KEY" }, 500);

        const body = new URLSearchParams();
        body.set("mode", "payment");
        body.set("success_url", `${origin}/success.html`);
        body.set("cancel_url", `${origin}/dashboard.html`);
        body.set("customer_email", email);
        // 使用 inline price_data 免設定 price id
        body.set("line_items[0][quantity]", "1");
        body.set("line_items[0][price_data][currency]", "usd");
        body.set("line_items[0][price_data][unit_amount]", "3300");
        body.set("line_items[0][price_data][product_data][name]", "1 Coaching Credit (50min)");
        // 可選：加上 metadata 方便追蹤
        body.set("metadata[email]", email);

        const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        });

        const data = await r.json();
        if (!r.ok || !data?.url) {
          console.error("❌ Failed to create checkout session:", data);
          return json({ ok: false, error: data?.error?.message || "Create session failed" }, 500);
        }

        return new Response(null, { status: 302, headers: { Location: data.url } });
      } catch (e) {
        console.error("❌ Checkout redirect error:", e.message);
        return json({ ok: false, error: String(e.message) }, 500);
      }
    }

    // ============================================================
    // �🟢 Calendly Webhook
    // invitee.created  → 預約成功：扣 1 點（僅在首次處理該預約時扣點，具冪等）
    // invitee.canceled → 取消預約：退回 1 點（僅在已存在的預約記錄上退點，避免重複）
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
      const calEvent = body.event;
      console.log(`📋 Calendly event: ${calEvent}`);

      const inviteeEmail =
        body?.payload?.invitee?.email ||
        body?.payload?.email ||
        body?.payload?.invitee_email;

      if (!inviteeEmail) {
        console.error("❌ No invitee email");
        return json({ error: "No invitee email" }, 400);
      }

      const projectId = env.GCP_PROJECT_ID;
      const emailDocId = toBase64Url(inviteeEmail);
      const eventUri = body?.payload?.event || "";
      const inviteeKey = body?.payload?.invitee?.uri || body?.payload?.invitee?.uuid || "";
      const bookingIdRaw = `${eventUri}::${inviteeKey}` || eventUri || inviteeKey;
      const bookingId = toBase64Url(bookingIdRaw);

      // 僅針對特定事件類型扣/退點（可依需求篩選 body.payload.event_type.uri 或 name）

      try {
        const token = await getGcpAccessToken(env);

        if (calEvent === "invitee.created") {
          console.log(`✅ Booking created for ${inviteeEmail}`);

          const bookingEntry = mapValue({
            calendlyEventUri: eventUri,
            bookingId: bookingIdRaw,
            status: "scheduled",
            createdAt: new Date().toISOString()
          });

          const writes = [
            // 事件冪等紀錄
            {
              update: {
                name: `projects/${projectId}/databases/(default)/documents/events_by_id/cal_${toBase64Url(calEvent + '::' + bookingIdRaw)}`,
                fields: mapValue({ type: calEvent, bookingId: bookingIdRaw, processedAt: new Date().toISOString() }).mapValue.fields
              },
              currentDocument: { exists: false }
            },
            // 確保使用者文件存在
            updateWrite(
              `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
              { email: { stringValue: inviteeEmail } },
              ["email"]
            ),
            // 冪等性：建立 bookings_by_id/{bookingId}（若已存在則整個提交失敗，避免重複扣點）
            {
              update: {
                name: `projects/${projectId}/databases/(default)/documents/bookings_by_id/${bookingId}`,
                fields: mapValue({
                  email: inviteeEmail,
                  calendlyEventUri: eventUri,
                  bookingId: bookingIdRaw,
                  status: "scheduled",
                  createdAt: new Date().toISOString()
                }).mapValue.fields
              },
              currentDocument: { exists: false }
            },
            // credits -1
            {
              transform: {
                document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
                fieldTransforms: [
                  { fieldPath: "credits", increment: { integerValue: "-1" } }
                ]
              }
            },
            // bookings array append
            {
              transform: {
                document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
                fieldTransforms: [
                  { fieldPath: "bookings", appendMissingElements: { values: [bookingEntry] } }
                ]
              }
            }
          ];

          try {
            await firestoreCommit(projectId, token, writes);
            console.log(`🎉 Firestore updated: ${inviteeEmail} used 1 credit (scheduled)`);
            return json({ ok: true, email: inviteeEmail, creditsDeducted: 1, bookingId });
          } catch (e) {
            // 若因已存在導致失敗（重送 webhook），不再扣點，直接回覆 OK 以避免重試風暴
            const msg = String(e.message || e);
            if (/ALREADY_EXISTS|409/.test(msg)) {
              console.warn(`ℹ️ Booking already processed: ${bookingId}`);
              return json({ ok: true, email: inviteeEmail, alreadyProcessed: true, bookingId });
            }
            console.error("❌ Firestore error (created):", e.message);
            return json({ error: "Firestore update failed", details: e.message }, 500);
          }
        }

        if (calEvent === "invitee.canceled") {
          console.log(`↩️ Booking canceled for ${inviteeEmail}`);

          const cancelEntry = mapValue({
            calendlyEventUri: eventUri,
            bookingId: bookingIdRaw,
            status: "canceled",
            canceledAt: new Date().toISOString()
          });

          const writes = [
            // 事件冪等紀錄
            {
              update: {
                name: `projects/${projectId}/databases/(default)/documents/events_by_id/cal_${toBase64Url(calEvent + '::' + bookingIdRaw)}`,
                fields: mapValue({ type: calEvent, bookingId: bookingIdRaw, processedAt: new Date().toISOString() }).mapValue.fields
              },
              currentDocument: { exists: false }
            },
            // 僅在預約記錄存在時才退點（避免無中生有）
            {
              update: {
                name: `projects/${projectId}/databases/(default)/documents/bookings_by_id/${bookingId}`,
                fields: mapValue({
                  status: "canceled",
                  canceledAt: new Date().toISOString()
                }).mapValue.fields
              },
              currentDocument: { exists: true }
            },
            {
              transform: {
                document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
                fieldTransforms: [
                  { fieldPath: "credits", increment: { integerValue: "1" } }
                ]
              }
            },
            // 附加取消紀錄到使用者文件，供 UI 顯示
            {
              transform: {
                document: `projects/${projectId}/databases/(default)/documents/users_by_email/${emailDocId}`,
                fieldTransforms: [
                  { fieldPath: "bookings", appendMissingElements: { values: [cancelEntry] } }
                ]
              }
            }
          ];

          try {
            await firestoreCommit(projectId, token, writes);
            console.log(`✅ Credit refunded for ${inviteeEmail} (canceled)`);
            return json({ ok: true, email: inviteeEmail, creditsRefunded: 1, bookingId });
          } catch (e) {
            const msg = String(e.message || e);
            if (/NOT_FOUND|404/.test(msg)) {
              console.warn(`ℹ️ No booking record to refund for ${bookingId}`);
              return json({ ok: true, noBookingRecord: true, bookingId });
            }
            console.error("❌ Firestore error (canceled):", e.message);
            return json({ error: "Firestore update failed", details: e.message }, 500);
          }
        }

        // 其他事件一律回覆已接收
        return json({ received: true });
      } catch (e) {
        console.error("❌ Calendly handler error:", e.message);
        return json({ error: "Calendly handler error", details: e.message }, 500);
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

  console.log("🔑 Signing JWT with private key...");
  let jwt;
  try {
    jwt = await signJwtRS256(header, claims, env.GOOGLE_PRIVATE_KEY);
  } catch (e) {
    console.error("❌ JWT signing failed:", e.message);
    throw e;
  }
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
  // 清理 PEM 格式：移除 header/footer 與所有空白/換行
  let pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")   // 移除轉義的 \n
    .replace(/\n/g, "")    // 移除真實換行
    .replace(/\r/g, "")    // 移除 \r
    .replace(/\s+/g, "");  // 移除所有空白
  
  // 補齊 base64 padding
  while (pemBody.length % 4 !== 0) {
    pemBody += '=';
  }
  
  try {
    const raw = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    return crypto.subtle.importKey("pkcs8", raw, { name: algorithm, hash: "SHA-256" }, false, ["sign"]);
  } catch (e) {
    console.error("❌ Failed to decode private key:", e.message);
    console.error("📏 Key length:", pemBody.length, "First 50 chars:", pemBody.substring(0, 50));
    throw new Error(`Invalid private key format: ${e.message}`);
  }
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
