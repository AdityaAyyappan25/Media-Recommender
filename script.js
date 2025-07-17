console.log("Setup complete! Ready to build your app.");
console.log("JavaScript is working perfectly!");

// Test Firebase connection
console.log("Checking Firebase configuration...");

if (window.firebaseConfig) {
    console.log("✅ Firebase config loaded successfully!");
    console.log("Firebase project ID:", window.firebaseConfig.projectId);
    console.log("Firebase ready for use!");
} else {
    console.log("❌ Firebase config not found - check firebase-config.js");
}

// Test if firebase-config.js loaded
if (typeof window.firebaseConfig !== 'undefined') {
    console.log("Firebase configuration object:", window.firebaseConfig);
} else {
    console.log("Firebase config file may not have loaded");
}