// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRRxTT1ZNsRFMRWqRO4u2Czh0xUmS2SLI",
  authDomain: "budget-calendar-1ded1.firebaseapp.com",
  projectId: "budget-calendar-1ded1",
  storageBucket: "budget-calendar-1ded1.firebasestorage.app",
  messagingSenderId: "1065927239680",
  appId: "1:1065927239680:web:0b4058ceb15168b1c5d0e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firestore so it can be used in other files
export const db = getFirestore(app);
