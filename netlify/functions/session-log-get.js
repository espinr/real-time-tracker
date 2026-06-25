const { getFirestore } = require("./firebase");

// GET /api/session-log-get?bib=<BIB_NUMBER>  → Get all summaries for a specific bib (newest first)
// GET /api/session-log-get?id=<SESSION_ID>  → Get one explicit session summary details
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

  const bib = event.queryStringParameters?.bib;
  const sessionId = event.queryStringParameters?.id;

  if (!bib && !sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Either query parameter 'bib' or 'id' is required." }),
    };
  }

  try {
    const db = getFirestore();
    
    // --- SCENARIO 1: Fetching a single specific session log document ---
    if (sessionId) {
      const docRef = await db.collection("session_logs").doc(sessionId).get();
      
      if (!docRef.exists) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: `No session log found matching id '${sessionId}'.` }),
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: docRef.data(),
        }),
      };
    }

    // --- SCENARIO 2: Fetching all logs assigned to a specific device bib ---
    let query = db
      .collection("session_logs")
      .where("deviceBib", "==", bib)
      .orderBy("startMs", "desc"); // Sorts sessions by newest run first

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No session logs found for device bib '${bib}'.` }),
      };
    }

    const entries = snapshot.docs.map((doc) => doc.data());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: entries.length,
        data: entries,
      }),
    };
  } catch (err) {
    console.error("Firestore error reading session logs:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve session summary logs." }),
    };
  }
};