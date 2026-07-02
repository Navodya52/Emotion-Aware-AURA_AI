import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbA_ZEubBKykM24EfybA4_wMQRm24Fgow",
  authDomain: "aura-ai-9efea.firebaseapp.com",
  projectId: "aura-ai-9efea",
  storageBucket: "aura-ai-9efea.firebasestorage.app",
  messagingSenderId: "159699677860",
  appId: "1:159699677860:web:buda73f384cf4f8405c2c31",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;