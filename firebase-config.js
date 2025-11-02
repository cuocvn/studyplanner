// firebase-config.js
// Firebase configuration - Compat version

// Kiểm tra Firebase đã load chưa
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK chưa được load!');
} else {
  const firebaseConfig = {
    apiKey: "AIzaSyDFg_r0_TDCX1A1rhG8JrshZqK2iA3MvIw",
    authDomain: "studyplanner-firebase.firebaseapp.com",
    projectId: "studyplanner-firebase", 
    storageBucket: "studyplanner-firebase.firebasestorage.app",
    messagingSenderId: "1099409491095",
    appId: "1:1099409491095:web:3b2986b83853413686d5d2",
    measurementId: "G-ZNM1SGNC5S"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Initialize services - ĐẶT VÀO WINDOW ĐỂ APP.JS THẤY
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  
  console.log('Firebase initialized successfully!');
}