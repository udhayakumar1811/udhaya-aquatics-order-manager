import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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