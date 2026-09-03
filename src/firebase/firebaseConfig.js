import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
<<<<<<< HEAD

const firebaseConfig = {
  apiKey: "AIzaSyBohfh4ZdV3ZaE4tdfJFNdonnLFpAySaDs",
  authDomain: "udhaya-aquatics-orders.firebaseapp.com",
  projectId: "udhaya-aquatics-orders",
  storageBucket: "udhaya-aquatics-orders.firebasestorage.app",
  messagingSenderId: "621865505471",
  appId: "1:621865505471:web:93bf9ad5ed11f8da49948a",
  measurementId: "G-8EPYT9W1GN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
=======
import { getAuth } from "firebase/auth";

// Firebase config is loaded from environment variables (see .env.example).
// Note: Firebase web config values are not secret by design (they identify
// the project, not authorize access) - actual protection comes from
// Firestore Security Rules (see firestore.rules) plus requiring sign-in.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fail loudly in dev instead of silently hitting a broken Firebase app.
  console.error(
    "Firebase config is missing. Copy .env.example to .env and fill in your project's values."
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
>>>>>>> claude-upgrade
