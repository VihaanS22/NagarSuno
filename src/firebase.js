import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCk7m8nWKxL2cd7QRvhU8IK8pS7TPa_GTs",
  authDomain: "civicfix-bbe1c.firebaseapp.com",
  projectId: "civicfix-bbe1c",
  storageBucket: "civicfix-bbe1c.firebasestorage.app",
  messagingSenderId: "586437819211",
  appId: "1:586437819211:web:cc4c056e41e92ae6cdc6ce",
  measurementId: "G-QRHK8QM7VX",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);