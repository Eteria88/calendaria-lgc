// api/paypal/create-plan.js
import { getAccessToken } from "./_client.js";

export default async function handler(req, res) {
  // Para seguridad: solo permitimos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { access_token, base } = await getAccessToken();

    // 1) Crear PRODUCTO
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
      return res.status(productRes.status).json({ error: "PayPal product error", details: product });
    }

    // 2) Crear PLAN (mensual)
    // Elegí el monto que quieras (ej: 11 USD). Luego podemos crear varios planes (11/33/55).
    const planRes = await fetch(`${base}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: product.id,
        name: "Apoyo mensual",
        description: "Aporte mensual automático",
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0, // 0 = infinito hasta cancelación
            pricing_scheme: {
              fixed_price: { value: "11.00", currency_code: "USD" },
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
      return res.status(planRes.status).json({ error: "PayPal plan error", details: plan });
    }

    return res.status(200).json({
      ok: true,
      product_id: product.id,
      plan_id: plan.id,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
