// api/health.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "calendaria-lgc",
    ts: Date.now(),
  });
}
