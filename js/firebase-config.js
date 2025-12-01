// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5mUr6bSmy6Yh9kyD1K1IDC6BNRVI-U6o",
  authDomain: "civicissuetrackerapp.firebaseapp.com",
  projectId: "civicissuetrackerapp",
  storageBucket: "civicissuetrackerapp.appspot.com",
  messagingSenderId: "52255435185",
  appId: "1:52255435185:web:68cfef81c27b42ae71b590"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
