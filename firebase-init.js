// firebase-init.js
// Import SDK dạng module (phiên bản hiện đại)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

// Cấu hình Firebase (thay bằng của anh)
const firebaseConfig = {
  apiKey: "AIzaSyDFg_r0_TDCX1A1rhG8JrshZqK2iA3MvIw",
  authDomain: "studyplanner-firebase.firebaseapp.com",
  projectId: "studyplanner-firebase",
  storageBucket: "studyplanner-firebase.firebasestorage.app",
  messagingSenderId: "1099409491095",
  appId: "1:1099409491095:web:3b2986b83853413686d5d2",
  measurementId: "G-ZNM1SGNC5S"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Xuất ra để dùng trong file khác
export { app, db, auth };
