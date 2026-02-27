const admin = require("firebase-admin");

let initialized = false;

function getFirestore() {
  if (!initialized) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
  }

  return admin.firestore();
}

module.exports = { getFirestore };
