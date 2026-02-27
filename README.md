# Geo API — Netlify + Firebase Firestore

A simple RESTful API to store and retrieve geo coordinates, deployable to Netlify for free.

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `POST` | `/api/location` | Store a location (upserts by ID) |
| `GET`  | `/api/location-get?id=<ID>` | Get a location by ID |

### POST `/api/location`

**Body (JSON):**
```json
{
  "id": "device-001",
  "lat": 48.8566,
  "lon": 2.3522
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": "device-001", "lat": 48.8566, "lon": 2.3522, "updatedAt": "2024-01-01T00:00:00.000Z" }
}
```

### GET `/api/location-get?id=device-001`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": "device-001", "lat": 48.8566, "lon": 2.3522, "updatedAt": "2024-01-01T00:00:00.000Z" }
}
```

---

## Setup

### 1. Firebase Firestore (free tier)

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Go to **Firestore Database** → Create database (start in test mode or set rules)
3. Go to **Project Settings** → **Service accounts** → **Generate new private key**
4. Download the JSON file — you'll need it as an env variable

### 2. Local development

```bash
npm install
cp .env.example .env
# Paste your Firebase service account JSON (minified, single line) into .env
netlify dev
```

### 3. Deploy to Netlify via GitHub

1. Push this project to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your repo — build settings are auto-detected via `netlify.toml`
4. Go to **Site settings** → **Environment variables** → Add:
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: the full contents of your Firebase service account JSON (paste as-is)
5. Deploy!

### Firestore security rules (recommended for production)

In Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /locations/{id} {
      allow read, write: if false; // only server-side access via Admin SDK
    }
  }
}
```

---

## Project structure

```
geo-api/
├── netlify/
│   └── functions/
│       ├── firebase.js       # Firebase Admin SDK init (shared)
│       ├── location.js       # POST handler
│       └── location-get.js   # GET handler
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
└── README.md
```
