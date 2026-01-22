# Market Passport - Setup Guide

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore and Authentication enabled

## 1. Clone and Install

```bash
cd /path/to/passport
pnpm install
```

## 2. Firebase Setup

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** in production mode
5. Note your project ID

### Configure Local Project

```bash
# Login to Firebase
firebase login

# Set your project
firebase use your-project-id
```

Update `.firebaserc` with your project ID.

### Set Environment Variables

**Web app** (`apps/web/.env.local`):

```bash
cp apps/web/.env.example apps/web/.env.local
```

Get values from Firebase Console → Project Settings → Your Apps → Web app.

**Functions** (`apps/functions/.env`):

```bash
cp apps/functions/.env.example apps/functions/.env
```

Generate a JWT secret:

```bash
openssl rand -base64 32
```

### Add Yourself as Admin

In Firebase Console → Firestore, create an `admins` collection with a document:

- Document ID: your email (lowercase)
- Fields: `{ email: "you@example.com", addedAt: <timestamp> }`

## 3. Run Locally

```bash
# Terminal 1: Run the web app
pnpm dev

# Terminal 2: Run Firebase emulators (optional, for testing functions)
cd apps/functions
npm run serve
```

Web app runs at `http://localhost:5173`

## 4. Deploy

```bash
# Build web app
pnpm build

# Deploy everything
firebase deploy

# Or deploy individually:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## Project Structure

```
passport/
├── apps/
│   ├── web/          # React PWA
│   └── functions/    # Firebase Cloud Functions
├── packages/
│   └── shared/       # Shared types, schemas, config
├── docs/             # Documentation
├── firebase.json     # Firebase config
├── firestore.rules   # Security rules
└── CLAUDE.md         # Product spec
```

## Next Steps

After setup, the remaining work (per CLAUDE.md section 9):

1. ✅ Scaffold repo
2. Add real QR scanning with `@zxing/browser`
3. Wire up Firebase Auth (Google sign-in)
4. Connect frontend to Cloud Functions
5. Add offline queue with IndexedDB
6. Create print-friendly QR page
