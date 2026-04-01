import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAvYOG4IzW9uNyhn6VQT34efjJMfEgKY-I",
  authDomain: "local-serve-3e46b.firebaseapp.com",
  databaseURL:
    "https://local-serve-3e46b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "local-serve-3e46b",
  storageBucket: "local-serve-3e46b.firebasestorage.app",
  messagingSenderId: "1029825948237",
  appId: "1:1029825948237:web:45e394d299d80b60384a04",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;
