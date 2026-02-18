import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Values should be populated from the Firebase Console
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let db: Database;
let firestore: Firestore;
let auth: Auth;

try {
    if (firebaseConfig.projectId && firebaseConfig.databaseURL) {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
} catch (error) {
    console.warn("Firebase initialization skipped or failed:", error);
}

if (app) {
    db = getDatabase(app);
    firestore = getFirestore(app);
    auth = getAuth(app);
} else {
    // Mock objects for build time or server-side rendering where env vars might be missing
    // This prevents "FIREBASE FATAL ERROR" during Next.js build
    console.warn("⚠️ Firebase not initialized. Missing environment variables or build mode.");
    db = {} as Database;
    firestore = {} as Firestore;
    auth = {} as Auth;
}



export const isFirebaseInitialized = !!app;
export { db, firestore, auth };
