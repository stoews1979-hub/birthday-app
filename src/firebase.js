import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSy...", // your real values
  authDomain: "birthday-reminder-app-xxxx.firebaseapp.com",
  projectId: "birthday-reminder-app-f1c32",
  storageBucket: "birthday-reminder-app-xxxx.appspot.com",
  messagingSenderId: "4913...",
  appId: "1:4913..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };