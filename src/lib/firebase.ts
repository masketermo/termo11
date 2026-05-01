import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAPPcEGtfims6KfZi7XVAiGuNZS2ID5fW0",
  authDomain: "masketermo-2fd2e.firebaseapp.com",
  databaseURL: "https://masketermo-2fd2e-default-rtdb.firebaseio.com",
  projectId: "masketermo-2fd2e",
  storageBucket: "masketermo-2fd2e.firebasestorage.app",
  messagingSenderId: "733808796066",
  appId: "1:733808796066:web:d19be209dc701ce47012fb",
  measurementId: "G-2NY8Y5D70K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
