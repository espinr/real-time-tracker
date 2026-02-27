const { getFirestore } = require("./firebase");

// GET /api/location-get?id=<ID>           → full history (newest first)
// GET /api/location-get?id=<ID>&last=1    → only the latest reading
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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
  const lastOnly = event.queryStringParameters?.last === "1";

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Query parameter 'id' is required." }),
    };
  }

  try {
    const db = getFirestore();

    let query = db
      .collection("locations")
      .doc(id)
      .collection("history")
      .orderBy("timestamp", "desc");

    if (lastOnly) {
      query = query.limit(1);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No location history found for id '${id}'.` }),
      };
    }

    // Serialize each GeoPoint to plain { lat, lon }
    const entries = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: d.id,
        location: {
          lat: d.location.latitude,
          lon: d.location.longitude,
        },
        timestamp: d.timestamp,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: entries.length,
        data: lastOnly ? entries[0] : entries,
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
