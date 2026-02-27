const admin = require("firebase-admin");
const { getFirestore } = require("./firebase");

// POST /api/location
// Body: { id: "string", lat: number, lon: number }
// Each call adds a new entry — history is preserved.
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const { id, lat, lon } = body;

  if (!id || typeof id !== "string") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'id' is required and must be a string." }) };
  }
  if (lat === undefined || typeof lat !== "number") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'lat' is required and must be a number." }) };
  }
  if (lon === undefined || typeof lon !== "number") {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'lon' is required and must be a number." }) };
  }
  if (lat < -90 || lat > 90) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'lat' must be between -90 and 90." }) };
  }
  if (lon < -180 || lon > 180) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'lon' must be between -180 and 180." }) };
  }

  try {
    const db = getFirestore();
    const timestamp = new Date().toISOString();

    const entry = {
      id,
      location: new admin.firestore.GeoPoint(lat, lon),
      timestamp,
    };

    // Each call adds a NEW document under locations/{id}/history/{auto-id}
    // This preserves the full history of all readings for each device.
    await db
      .collection("locations")
      .doc(id)
      .collection("history")
      .add(entry);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: { id, location: { lat, lon }, timestamp },
      }),
    };
  } catch (err) {
    console.error("Firestore error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to save location." }),
    };
  }
};
