// netlify/functions/etherscan.js
exports.handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  // Lire la clé — supporte les deux noms de variable
  const API_KEY =
    process.env.ETHERSCAN_KEY ||
    process.env.VITE_ETHERSCAN_KEY ||
    "";

  // Debug : log le nom des vars dispo (sans valeur)
  console.log("[etherscan.js] ETHERSCAN_KEY set:", !!process.env.ETHERSCAN_KEY);
  console.log("[etherscan.js] VITE_ETHERSCAN_KEY set:", !!process.env.VITE_ETHERSCAN_KEY);
  console.log("[etherscan.js] API_KEY resolved:", !!API_KEY, "length:", API_KEY.length);

  if (!API_KEY) {
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        status: "0",
        message: "NOTOK",
        result: "Clé API manquante — ajoutez ETHERSCAN_KEY dans Netlify > Site configuration > Environment variables"
      }),
    };
  }

  const q = event.queryStringParameters || {};
  const params = new URLSearchParams({ apikey: API_KEY });

  ["module","action","address","startblock","endblock",
   "page","offset","sort","tag","contractaddress"].forEach(k => {
    if (q[k] !== undefined && q[k] !== "") params.set(k, q[k]);
  });

  const url = "https://api.etherscan.io/api?" + params.toString();
  console.log("[etherscan.js] Calling:", url.replace(/apikey=[^&]+/, "apikey=***"));

  try {
    const res  = await fetch(url);
    const data = await res.json();
    console.log("[etherscan.js] Response status:", data.status, "| message:", data.message);
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("[etherscan.js] Fetch error:", err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ status: "0", message: "Proxy fetch error: " + err.message }),
    };
  }
};
