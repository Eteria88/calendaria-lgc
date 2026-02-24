// api/paypal/create-plan.js
import { getAccessToken } from "./_client.js";

function normalizeAmount(raw) {
  // Acepta "7", "7.0", "7.00", 7, "33.00"
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  // 2 decimales
  return n.toFixed(2);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { access_token, base } = await getAccessToken();

    const body = req.body || {};
    const amount = normalizeAmount(body.amount);

    if (!amount) {
      return res.status(400).json({
        error: 'Missing/invalid amount. Example: { "amount": "7.00" }',
      });
    }

    // 1) Crear PRODUCTO (lo creamos si no existe uno guardado)
    // Para no crear miles de productos, podemos reutilizar uno si guardás PAYPAL_PRODUCT_ID en env vars.
    let productId = process.env.PAYPAL_PRODUCT_ID;

    if (!productId) {
      const productRes = await fetch(`${base}/v1/catalogs/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Calendaria-LGC (Apoyo mensual)",
          description: "Suscripción mensual para apoyar el proyecto Calendaria-LGC",
          type: "SERVICE",
          category: "SOFTWARE",
        }),
      });

      const product = await productRes.json();
      if (!productRes.ok) {
        return res
          .status(productRes.status)
          .json({ error: "PayPal product error", details: product });
      }
      productId = product.id;
    }

    // 2) Crear PLAN (mensual) con el monto elegido
    const planRes = await fetch(`${base}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        name: `Apoyo mensual USD ${amount}`,
        description: `Aporte mensual automático de USD ${amount}`,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: amount, currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });

    const plan = await planRes.json();
    if (!planRes.ok) {
      return res
        .status(planRes.status)
        .json({ error: "PayPal plan error", details: plan });
    }

    return res.status(200).json({
      ok: true,
      product_id: productId,
      plan_id: plan.id,
      amount,
      note:
        "Tip: si querés reutilizar el mismo producto siempre, guardá PAYPAL_PRODUCT_ID en Vercel env vars.",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
