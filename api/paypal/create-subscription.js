// api/paypal/create-subscription.js
import { getAccessToken } from "./_client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
const plan_id = body.plan_id || process.env.PAYPAL_PLAN_ID;

if (!plan_id) {
  return res.status(400).json({ error: "Missing plan_id (and PAYPAL_PLAN_ID not set)" });

    }

    const { access_token, base } = await getAccessToken();

    const r = await fetch(`${base}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id,
        application_context: {
          brand_name: "Calendaria-LGC",
          user_action: "SUBSCRIBE_NOW",
          return_url: "https://calendaria-lgc.red/apoyar?paypal=success",
          cancel_url: "https://calendaria-lgc.red/apoyar?paypal=cancel",
        },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "PayPal error", details: data });
    }

    const approve_url = (data.links || []).find((l) => l.rel === "approve")?.href;

    return res.status(200).json({
      ok: true,
      id: data.id,
      approve_url,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
