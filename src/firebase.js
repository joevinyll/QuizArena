import { initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBjTUCPsXTC6tKh5ZXbrz6g2-SDNSXq3pM",
  authDomain: "quizarena-3614d.firebaseapp.com",
  databaseURL: "https://quizarena-3614d-default-rtdb.firebaseio.com",
  projectId: "quizarena-3614d",
  storageBucket: "quizarena-3614d.firebasestorage.app",
  messagingSenderId: "962223460928",
  appId: "1:962223460928:web:715a76ed644c241ef545a5",
  measurementId: "G-NZ2XDF9BNZ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const authReady = setPersistence(auth, browserSessionPersistence);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { app, auth, authReady, db, realtimeDb, firebaseConfig };
