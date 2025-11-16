import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stripe-webhook") {
      const sig = request.headers.get("stripe-signature");
      const body = await request.text();

      try {
        const stripe = new Stripe(env.STRIPE_SECRET_KEY);

        // ⚡️ 使用非同步驗證
        const event = await stripe.webhooks.constructEventAsync(
          body,
          sig,
          env.STRIPE_WEBHOOK_SECRET
        );

        console.log("✅ Verified event:", event.type);

        // 初始化 Firestore
        const app = initializeApp({
          credential: cert({
            client_email: env.GOOGLE_CLIENT_EMAIL,
            private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            project_id: env.GOOGLE_PROJECT_ID,
          }),
        });
        const db = getFirestore(app);

        // 🎯 處理不同事件
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const customerEmail = session.customer_details.email;

          await db.collection("users_by_email").doc(customerEmail).set(
            {
              payment: { status: "paid", amount: session.amount_total },
              credits: 5, // 付款後加 5 點
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          console.log(`🔥 Firestore updated for ${customerEmail}`);
        }

        if (event.type === "payment_intent.succeeded") {
          const intent = event.data.object;
          console.log(`💳 PaymentIntent succeeded: ${intent.id}, amount: ${intent.amount}`);
          // 可選：記錄交易流水或安全檢查
        }

        return new Response("ok", { status: 200 });
      } catch (err) {
        console.error("❌ Webhook error:", err.message);
        return new Response("invalid signature", { status: 400 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
}
