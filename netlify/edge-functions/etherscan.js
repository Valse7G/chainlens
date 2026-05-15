// netlify/functions/etherscan.js
// Runtime : Node.js 20 — pas de dépendances externes requises

export default async (req, context) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const API_KEY =
    Netlify.env.get("ETHERSCAN_KEY") ||
    Netlify.env.get("VITE_ETHERSCAN_KEY") ||
    "";

  console.log("[etherscan fn] ETHERSCAN_KEY présente:", !!API_KEY, "| longueur:", API_KEY.length);

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ status: "0", message: "NOTOK", result: "ETHERSCAN_KEY manquante côté serveur" }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams({ apikey: API_KEY });

  for (const k of ["module","action","address","startblock","endblock","page","offset","sort","tag","contractaddress"]) {
    const v = searchParams.get(k);
    if (v !== null && v !== "") params.set(k, v);
  }

  const esUrl = "https://api.etherscan.io/api?" + params.toString();
  console.log("[etherscan fn] →", esUrl.replace(/apikey=[^&]+/, "apikey=***"));

  try {
    const res  = await fetch(esUrl);
    const data = await res.json();
    console.log("[etherscan fn] ← status:", data.status, "| message:", data.message, "| result count:", Array.isArray(data.result) ? data.result.length : typeof data.result);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[etherscan fn] Erreur fetch:", err.message);
    return new Response(
      JSON.stringify({ status: "0", message: "Fetch error: " + err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/etherscan" };
