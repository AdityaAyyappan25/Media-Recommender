// API Configuration
const API_CONFIG = {
    youtube: {
        apiKey: "AIzaSyB6dVcOxn1injap51JJ0_JTyXgtxtsxvWY",
        baseUrl: "https://www.googleapis.com/youtube/v3"
    },
    tmdb: {
        apiKey: "ac87ab2b308b11267ebb6bbc67c3a239", 
        baseUrl: "https://api.themoviedb.org/3"
    }
};

// Make available globally
window.API_CONFIG = API_CONFIG;
console.log("🔑 API configuration loaded!");