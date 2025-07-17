// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEST-Z_C_RODDDayJKKmeNxXZztKAonrs",
    authDomain: "media-recommender-9d8fb.firebaseapp.com",
    projectId: "media-recommender-9d8fb",
    storageBucket: "media-recommender-9d8fb.firebasestorage.app",
    messagingSenderId: "794416956522",
    appId: "1:794416956522:web:37cf1fc6fd5d79bdc13613",
    measurementId: "G-E98T38B66D"
  };
  
  // Initialize Firebase (we'll add this later)
  // const app = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(app);
  
  // Export for use in other files
  window.firebaseConfig = firebaseConfig;
  console.log("🔥 Firebase config file loaded successfully!");