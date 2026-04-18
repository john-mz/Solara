import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp6-8Bpb1zxHH5VcRNKrOxEwr1Yh7yI4g",
  authDomain: "hackathon-cursor.firebaseapp.com",
  projectId: "hackathon-cursor",
  storageBucket: "hackathon-cursor.firebasestorage.app",
  messagingSenderId: "956732206425",
  appId: "1:956732206425:web:5662d8897f1bf372677048",
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);
