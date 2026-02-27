const { getFirestore } = require("./firebase");

// GET /api/location-get?id=<ID>
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use GET." }),
    };
  }

  const id = event.queryStringParameters?.id;

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Query parameter 'id' is required." }),
    };
  }

  try {
    const db = getFirestore();
    const doc = await db.collection("locations").doc(id).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No location found for id '${id}'.` }),
      };
    }

    const data = doc.data();

    // Serialize Firestore GeoPoint to plain { lat, lon }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          id: data.id,
          location: {
            lat: data.location.latitude,
            lon: data.location.longitude,
          },
          timestamp: data.timestamp,
        },
      }),
    };
  } catch (err) {
    console.error("Firestore error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve location." }),
    };
  }
};
