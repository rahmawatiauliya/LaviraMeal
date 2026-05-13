import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Untuk Database
import { getAuth } from "firebase/auth";           // Untuk Login/Daftar

// Konfigurasi dari gambar yang kamu kirim
const firebaseConfig = {
  apiKey: "AIzaSyB23kN1Z2G6VkSKTY3gYtrnM4jNcvKjpa8",
  authDomain: "lavira-6036e.firebaseapp.com",
  projectId: "lavira-6036e",
  storageBucket: "lavira-6036e.firebasestorage.app",
  messagingSenderId: "581744257306",
  appId: "1:581744257306:web:00a06a06b8f943575be4a3"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor agar bisa dipakai di file lain (seperti RegisterScreen.js)
export const db = getFirestore(app);
export const auth = getAuth(app);