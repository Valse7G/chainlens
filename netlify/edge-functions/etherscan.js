// netlify/edge-functions/etherscan.js

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

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ status: "0", message: "NOTOK", result: "ETHERSCAN_KEY manquante" }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // Lire les query params envoyés par le client
  const incomingUrl = new URL(req.url);
  const sp = incomingUrl.searchParams;

  // Log tous les params reçus pour debug
  const allParams = {};
  for (const [k, v] of sp.entries()) allParams[k] = v;
  console.log("[etherscan fn] params reçus:", JSON.stringify(allParams));

  // Construire l'URL Etherscan — on recopie TOUS les params + on ajoute la clé
  const esParams = new URLSearchParams();
  for (const [k, v] of sp.entries()) {
    if (k !== "apikey") esParams.set(k, v); // ne pas laisser le client surcharger la clé
  }
  esParams.set("apikey", API_KEY);

  esParams.set("chainid", "1"); // Ethereum mainnet — API V2 obligatoire
  const esUrl = "https://api.etherscan.io/v2/api?" + esParams.toString();
  console.log("[etherscan fn] URL →", esUrl.replace(/apikey=[^&]+/, "apikey=***"));

  try {
    const res  = await fetch(esUrl, {
      headers: { "User-Agent": "ChainLens/1.0" }
    });
    const text = await res.text();

    // Log la réponse brute (premiers 300 chars)
    console.log("[etherscan fn] raw response (300):", text.slice(0, 300));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[etherscan fn] JSON parse failed:", text.slice(0, 200));
      return new Response(
        JSON.stringify({ status: "0", message: "Invalid JSON from Etherscan", result: text.slice(0, 200) }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    console.log("[etherscan fn] status:", data.status, "| message:", data.message, "| result:", typeof data.result === "string" ? data.result.slice(0,100) : `array[${data.result?.length}]`);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[etherscan fn] fetch error:", err.message);
    return new Response(
      JSON.stringify({ status: "0", message: "Proxy fetch error: " + err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/etherscan" };
