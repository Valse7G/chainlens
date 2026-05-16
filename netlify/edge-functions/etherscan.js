// netlify/edge-functions/etherscan.js
// Serverless proxy for Etherscan V2 API — key never reaches the browser

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
  const esParams = new URLSearchParams();

  // Forward all client params except apikey (we inject server-side)
  for (const [k, v] of searchParams.entries()) {
    if (k !== "apikey") esParams.set(k, v);
  }
  esParams.set("chainid", "1");
  esParams.set("apikey", API_KEY);

  const esUrl = "https://api.etherscan.io/v2/api?" + esParams.toString();
  console.log("[etherscan fn] params reçus:", JSON.stringify(Object.fromEntries(searchParams)));
  console.log("[etherscan fn] URL →", esUrl.replace(/apikey=[^&]+/, "apikey=***"));

  try {
    const res = await fetch(esUrl, {
      headers: { "User-Agent": "ChainLens/2.0.2" },
    });
    const text = await res.text();
    console.log("[etherscan fn] raw response (300):", text.slice(0, 300));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ status: "0", message: "Invalid JSON", result: text.slice(0, 100) }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Log result type properly
    const resultType = Array.isArray(data.result)
      ? `array[${data.result.length}]`
      : typeof data.result === "object" && data.result !== null
        ? `object{${Object.keys(data.result).join(",")}}`
        : String(data.result).slice(0, 80);
    console.log("[etherscan fn] status:", data.status, "| message:", data.message, "| result:", resultType);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[etherscan fn] fetch error:", err.message);
    return new Response(
      JSON.stringify({ status: "0", message: "Proxy error: " + err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/etherscan" };
