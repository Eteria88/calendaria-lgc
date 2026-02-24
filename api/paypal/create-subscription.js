// api/paypal/create-subscription.js
import { getAccessToken } from "./_client.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const amount = Number(body.amount);

    // Elegimos plan según monto
    let plan_id;
    if (amount === 7) plan_id = process.env.PAYPAL_PLAN_ID_7;
    else if (amount === 33) plan_id = process.env.PAYPAL_PLAN_ID_33;
    else plan_id = process.env.PAYPAL_PLAN_ID; // default (11)

    if (!plan_id) {
      return res
        .status(400)
        .json({ error: "Missing plan_id env var for selected amount" });
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
      amount: amount || 11,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
