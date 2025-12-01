// js/auth.js
import { auth, db } from "../firebase-config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Hardcoded Admin UID
const ADMIN_UID = "OfHleQwQjgMRXTgroiAxJCJu5Sd2";

// --- LOGIN ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.uid === ADMIN_UID) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "citizen-dashboard.html";
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// --- REGISTER ---
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: user.uid === ADMIN_UID ? "admin" : "citizen"
    });

    if (user.uid === ADMIN_UID) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "citizen-dashboard.html";
    }
  } catch (error) {
    alert("Registration failed: " + error.message);
  }
});

// --- AUTO REDIRECT IF LOGGED IN ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.uid === ADMIN_UID) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "citizen-dashboard.html";
    }
  }
});
