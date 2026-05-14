// netlify/functions/etherscan.js
// Proxy serverless — tourne côté serveur, élimine les CORS
exports.handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  // Clé API côté serveur uniquement — jamais exposée au navigateur
  const API_KEY = process.env.ETHERSCAN_KEY || "";
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ status: "0", message: "ETHERSCAN_KEY manquante côté serveur" }),
    };
  }

  const q = event.queryStringParameters || {};
  const params = new URLSearchParams({ apikey: API_KEY });
  ["module","action","address","startblock","endblock","page","offset","sort","tag","contractaddress"].forEach(k => {
    if (q[k] !== undefined) params.set(k, q[k]);
  });

  const url = "https://api.etherscan.io/api?" + params.toString();

  try {
    const res  = await fetch(url);
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ status: "0", message: "Proxy error: " + err.message }),
    };
  }
};
