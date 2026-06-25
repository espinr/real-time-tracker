const admin = require("firebase-admin");
const { getFirestore } = require("./firebase");

// POST /api/session-log
// Body: SessionSummaryLogEntry
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

  const { sessionId, deviceBib, startMs, endMs, durationHuman, sent, errors, successRate, gps, conn } = body;

  // Basic validation
  if (!sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Field 'sessionId' is required." }) };
  }

  try {
    const db = getFirestore();
    const timestamp = new Date().toISOString();

    const entry = {
      sessionId,
      deviceBib: deviceBib || sessionId.split('_')[0],
      startMs,
      endMs,
      durationHuman,
      sent,
      errors,
      successRate,
      gps: {
        strongPct: gps?.strongPct ?? 0,
        degradedPct: gps?.degradedPct ?? 0,
        noPct: gps?.noPct ?? 0,
      },
      conn: {
        onlinePct: conn?.onlinePct ?? 0,
        offlinePct: conn?.offlinePct ?? 0,
      },
      uploadedAt: timestamp
    };

    // Store log inside a distinct "session_logs" root collection 
    // using the explicit unique sessionId as the Document ID
    await db
      .collection("session_logs")
      .doc(sessionId)
      .set(entry);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        sessionId: sessionId,
        uploadedAt: timestamp
      }),
    };
  } catch (err) {
    console.error("Firestore error writing session log:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to save session summary log." }),
    };
  }
};