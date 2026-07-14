import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAudB0J6VIVMlEnMdl7dLaENSlGHB1ULfY",
  authDomain: "fortunate-hub.firebaseapp.com",
  projectId: "fortunate-hub",
  storageBucket: "fortunate-hub.firebasestorage.app",
  messagingSenderId: "743010342137",
  appId: "1:743010342137:web:a3640e993fc9bfe3b9fe28",
  measurementId: "G-N69F538RKT",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
