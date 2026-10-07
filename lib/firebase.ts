import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRQnZKRbEVgpyNcv7h8L9FZiBy7AQ3Nz0",
  authDomain: "solara-stiven-dev.firebaseapp.com",
  projectId: "solara-stiven-dev",
  storageBucket: "solara-stiven-dev.firebasestorage.app",
  messagingSenderId: "148637551520",
  appId: "1:148637551520:web:25f0663a4dd92311e8f2c5",
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
