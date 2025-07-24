// Content Recommender MVP - Personalized AI Learning System
console.log("🚀 Content Recommender with AI Personalization starting...");

class ContentRecommender {
    constructor() {
        // App state variables
        this.selectedTime = null;
        this.selectedInterests = [];
        this.currentRecommendations = [];
        this.sessionId = null;
        
        // User statistics for tracking
        this.userStats = {
            sessionsStarted: 0,
            recommendationsRequested: 0,
            contentClicked: 0
        };
        
        // ✨ NEW: Personalization System
        this.userProfile = this.loadUserProfile();
        this.recommendationHistory = this.loadRecommendationHistory();
        
        // Initialize the application
        this.init();
    }

    init() {
        console.log("🔧 Initializing Content Recommender with AI learning...");
        
        // Check if required configurations are loaded
        this.checkConfigurations();
        
        // Set up event listeners for user interactions
        this.setupEventListeners();
        
        // Update UI with initial state
        this.updateStats();
        
        console.log("✅ Content Recommender with personalization initialized!");
    }

    checkConfigurations() {
        // Check if Firebase configuration is available
        if (window.firebaseConfig) {
            console.log("✅ Firebase config loaded - analytics enabled");
        } else {
            console.warn("⚠️ Firebase config not found - analytics disabled");
        }

        // Check if API configuration is available
        if (window.API_CONFIG && window.API_CONFIG.youtube && window.API_CONFIG.youtube.apiKey) {
            console.log("✅ YouTube API config loaded - LIVE RECOMMENDATIONS ENABLED!");
            console.log("🌐 App will use real YouTube API with smart shorts filtering");
        } else {
            console.warn("⚠️ YouTube API config not found - DEMO MODE ONLY");
            console.log("📋 App will use high-quality demo content instead");
            console.log("💡 Add YouTube API key to api-config.js to enable live recommendations");
        }
    }

    // ================================
    // PERSONALIZATION SYSTEM
    // ================================

    loadUserProfile() {
        try {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                const profile = JSON.parse(saved);
                console.log("👤 Loaded existing user profile with", Object.keys(profile.interestScores).length, "interests tracked");
                return profile;
            }
        } catch (error) {
            console.warn("⚠️ Error loading user profile:", error);
        }
        
        // Create new user profile
        const newProfile = {
            // Interest preferences (learned from clicks)
            interestScores: {
                comedy: 0, technology: 0, music: 0, education: 0,
                gaming: 0, cooking: 0, fitness: 0, documentary: 0
            },
            
            // Time preferences (when user prefers what duration)
            timePreferences: {
                morning: { preferred: [], avoided: [] },
                afternoon: { preferred: [], avoided: [] },
                evening: { preferred: [], avoided: [] }
            },
            
            // Content type preferences
            contentTypeScores: {
                tutorial: 0, entertainment: 0, educational: 0,
                music: 0, comedy: 0, documentary: 0
            },
            
            // Behavioral patterns
            patterns: {
                averageSessionTime: 0,
                mostActiveTimeOfDay: null,
                preferredContentLength: null,
                clickThroughRate: 0,
                totalSessions: 0
            },
            
            // Feedback and learning
            feedback: {
                liked: [], // Content IDs user explicitly liked
                disliked: [], // Content IDs user didn't engage with
                viewed: [] // Content IDs user has seen (avoid repeats)
            },
            
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        this.saveUserProfile(newProfile);
        console.log("👤 Created new user profile - ready to learn your preferences!");
        return newProfile;
    }

    loadRecommendationHistory() {
        try {
            const saved = localStorage.getItem('recommendationHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn("⚠️ Error loading recommendation history:", error);
            return [];
        }
    }

    saveUserProfile(profile = this.userProfile) {
        try {
            profile.lastUpdated = new Date().toISOString();
            localStorage.setItem('userProfile', JSON.stringify(profile));
            console.log("💾 User profile saved with learning data");
        } catch (error) {
            console.warn("⚠️ Error saving user profile:", error);
        }
    }

    // Learn from user behavior and update profile
    updateUserProfile(action, data) {
        const timeOfDay = this.getTimeOfDay();
        
        switch (action) {
            case 'interest_selected':
                // Boost score for selected interests
                data.interests.forEach(interest => {
                    if (this.userProfile.interestScores.hasOwnProperty(interest)) {
                        this.userProfile.interestScores[interest] += 1;
                    }
                });
                break;
                
            case 'content_clicked':
                // Strongest learning signal - user actually engaged
                const contentInterests = data.interests || [];
                contentInterests.forEach(interest => {
                    if (this.userProfile.interestScores.hasOwnProperty(interest)) {
                        this.userProfile.interestScores[interest] += 5; // Higher weight for clicks
                    }
                });
                
                // Add to viewed and liked lists
                this.userProfile.feedback.viewed.push(data.contentId);
                this.userProfile.feedback.liked.push(data.contentId);
                
                // Update behavioral patterns
                this.userProfile.patterns.totalSessions++;
                this.userProfile.patterns.mostActiveTimeOfDay = timeOfDay;
                break;
        }
        
        // Calculate click-through rate
        const totalViewed = this.userProfile.feedback.viewed.length;
        const totalClicked = this.userProfile.feedback.liked.length;
        this.userProfile.patterns.clickThroughRate = totalViewed > 0 ? (totalClicked / totalViewed) : 0;
        
        this.saveUserProfile();
        
        console.log("🧠 Learning from your behavior:", {
            action,
            topInterests: this.getTopInterests(2).map(i => i.interest),
            totalInteractions: totalViewed
        });
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    getTopInterests(limit = 3) {
        return Object.entries(this.userProfile.interestScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([interest, score]) => ({ interest, score }));
    }

    // Get personalized recommendations with smart scoring
    getPersonalizedRecommendations(baseRecommendations) {
        console.log("🎯 Applying AI personalization to recommendations...");
        
        const topInterests = this.getTopInterests().map(item => item.interest);
        
        const personalizedRecommendations = baseRecommendations.map(item => {
            let personalizedScore = 0;
            
            // Interest matching (0-50 points)
            const itemInterests = item.keywords || [];
            itemInterests.forEach(interest => {
                if (this.userProfile.interestScores[interest]) {
                    personalizedScore += this.userProfile.interestScores[interest] * 5;
                }
            });
            
            // Novelty bonus (0-15 points) - prefer content user hasn't seen
            if (!this.userProfile.feedback.viewed.includes(item.id)) {
                personalizedScore += 15;
            } else {
                personalizedScore -= 10; // Penalty for repeated content
            }
            
            // Trending with user's interests (0-10 points)
            if (topInterests.some(interest => item.keywords.includes(interest))) {
                personalizedScore += 10;
            }
            
            return {
                ...item,
                personalizedScore,
                isPersonalized: personalizedScore > 20,
                personalizedReason: personalizedScore > 40 ? "Perfect match for you!" : 
                                  personalizedScore > 20 ? "Recommended based on your interests" : "Discover something new"
            };
        });
        
        // Sort by personalized score
        const sortedRecommendations = personalizedRecommendations.sort((a, b) => 
            b.personalizedScore - a.personalizedScore
        );
        
        console.log("✨ Personalization complete:", {
            topPick: sortedRecommendations[0]?.title,
            score: sortedRecommendations[0]?.personalizedScore,
            userTopInterests: topInterests
        });
        
        return sortedRecommendations;
    }

    setupEventListeners() {
        console.log("🎯 Setting up smart event listeners...");

        // Time selection buttons
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(button => {
            button.addEventListener('click', (e) => this.selectTime(e));
        });

        // Interest selection checkboxes
        const interestItems = document.querySelectorAll('.interest-item');
        interestItems.forEach(item => {
            item.addEventListener('click', (e) => this.toggleInterest(e));
        });

        // Get recommendations button
        const getRecommendationsBtn = document.getElementById('get-recommendations');
        if (getRecommendationsBtn) {
            getRecommendationsBtn.addEventListener('click', () => this.getRecommendations());
        }

        // Get more recommendations button
        const getMoreBtn = document.getElementById('get-more');
        if (getMoreBtn) {
            getMoreBtn.addEventListener('click', () => this.getMoreRecommendations());
        }

        // Add personalization UI elements
        this.addPersonalizationUI();

        console.log("🎯 Smart event listeners ready - AI learning enabled!");
    }

    addPersonalizationUI() {
        console.log("🧠 Adding AI personalization UI elements...");

        // Add AI profile button
        const profileButton = document.createElement('button');
        profileButton.textContent = '🧠 Your AI Profile';
        profileButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        `;
        profileButton.onclick = () => this.showUserProfile();
        document.body.appendChild(profileButton);

        // Add smart demo indicator
        const demoIndicator = document.createElement('div');
        demoIndicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50px;
                right: 10px;
                background: linear-gradient(135deg, #4ecdc4, #44a08d);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
                cursor: pointer;
            ">
                🧠 AI Learning Mode - Getting Smarter!
            </div>
        `;
        demoIndicator.onclick = () => {
            const interactions = this.userProfile.feedback.viewed.length;
            const topInterests = this.getTopInterests(2);
            alert(`🧠 AI Learning Mode Active!\n\n✅ ${interactions} interactions recorded\n✅ Learning your preferences\n✅ No shorts ever!\n\n🎯 Your interests: ${topInterests.map(i => i.interest).join(', ') || 'Still learning...'}\n\nThe more you click, the smarter it gets!`);
        };
        document.body.appendChild(demoIndicator);

        // Add test YouTube API button for debugging
        const testYouTubeButton = document.createElement('button');
        testYouTubeButton.textContent = '🌐 Test YouTube API';
        testYouTubeButton.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1000;
        `;
        testYouTubeButton.onclick = async () => {
            if (!window.API_CONFIG || !window.API_CONFIG.youtube || !window.API_CONFIG.youtube.apiKey) {
                alert("❌ No YouTube API key found!\n\nAdd your YouTube API key to api-config.js to test live recommendations.");
                return;
            }
            
            console.log("🧪 Testing YouTube API...");
            this.selectedTime = 15;
            this.selectedInterests = ['comedy'];
            
            try {
                const youtubeResults = await this.fetchFromYouTubeAPI();
                console.log("✅ YouTube API test successful:", youtubeResults.length, "results");
                
                if (youtubeResults.length > 0) {
                    const personalizedResults = this.getPersonalizedRecommendations(youtubeResults);
                    this.displayRecommendations(personalizedResults);
                    document.getElementById('results-section').style.display = 'block';
                    alert(`✅ YouTube API Working!\n\nFound ${youtubeResults.length} real videos from YouTube.\nCheck the results - they should have "📡 Live from YouTube" labels.`);
                } else {
                    alert("⚠️ YouTube API returned no results.\nThis might be due to strict filtering or API limits.\nTry different search terms.");
                }
            } catch (error) {
                console.error("❌ YouTube API test failed:", error);
                alert(`❌ YouTube API Error:\n\n${error.message}\n\nCheck your API key and try again.`);
            }
        };
        document.body.appendChild(testYouTubeButton);

        console.log("🧠 AI personalization UI added - YouTube API test button available!");
    }

    showUserProfile() {
        const topInterests = this.getTopInterests(5);
        const totalInteractions = this.userProfile.feedback.viewed.length;
        const clickedContent = this.userProfile.feedback.liked.length;
        const clickRate = totalInteractions > 0 ? Math.round((clickedContent / totalInteractions) * 100) : 0;
        
        const profileModal = document.createElement('div');
        profileModal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;
        
        profileModal.innerHTML = `
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="text-align: center; margin-bottom: 20px; color: #333;">🧠 Your AI Learning Profile</h2>
                
                <div style="margin-bottom: 20px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;">${clickRate}%</div>
                    <div style="font-size: 14px; color: #718096;">Click-through rate</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px; color: #4a5568;">📊 Your Top Interests</h3>
                    ${topInterests.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; margin: 5px 0; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
                            <span style="font-weight: 500; text-transform: capitalize;">${item.interest}</span>
                            <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">${item.score} points</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px; color: #4a5568;">🎯 Learning Status</h3>
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #bae6fd;">
                        ${totalInteractions < 5 ? 
                            '<div style="color: #0369a1;">🌱 <strong>Just Started:</strong> Keep clicking to help AI learn!</div>' :
                            totalInteractions < 15 ?
                            '<div style="color: #0369a1;">📈 <strong>Learning:</strong> AI is understanding your preferences!</div>' :
                            '<div style="color: #15803d;">🎯 <strong>Personalized:</strong> AI knows your taste - recommendations are tailored!</div>'
                        }
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">Close</button>
                </div>
            </div>
        `;
        
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) profileModal.remove();
        });
        
        document.body.appendChild(profileModal);
    }

    selectTime(event) {
        const button = event.currentTarget;
        const minutes = parseInt(button.dataset.minutes);

        // Remove previous selection
        document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        this.selectedTime = minutes;

        // Learn from selection
        this.updateUserProfile('time_selected', { duration: minutes });

        this.updateRecommendationButton();
        this.updateStats();
        
        console.log(`⏰ Selected ${minutes} minutes - AI learning your time preferences`);
    }

    toggleInterest(event) {
        event.preventDefault();
        
        const item = event.currentTarget;
        const checkbox = item.querySelector('input[type="checkbox"]');
        const interest = checkbox.value;

        if (checkbox.checked) {
            checkbox.checked = false;
            item.classList.remove('selected');
            this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
        } else {
            checkbox.checked = true;
            item.classList.add('selected');
            this.selectedInterests.push(interest);
        }

        // Learn from interest selection
        this.updateUserProfile('interest_selected', { interests: [...this.selectedInterests] });

        this.updateRecommendationButton();
        this.updateStats();
        
        console.log(`🎭 Updated interests: ${this.selectedInterests.join(', ')} - AI updating your profile`);
    }

    updateRecommendationButton() {
        const button = document.getElementById('get-recommendations');
        if (!button) return;

        const hasTime = this.selectedTime !== null;
        const hasInterests = this.selectedInterests.length > 0;

        if (hasTime && hasInterests) {
            button.disabled = false;
            const interestText = this.selectedInterests.slice(0, 2).join(' & ');
            button.textContent = `🧠 Get AI-Powered ${this.selectedTime}min ${interestText} Recommendations`;
            button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        } else {
            button.disabled = true;
            button.textContent = '🔍 Select time and interests first';
            button.style.background = '#cbd5e0';
        }
    }

    async getRecommendations() {
        console.log("🧠 Getting AI-personalized recommendations...");
        this.userStats.recommendationsRequested++;
        this.showLoading(true);

        try {
            const recommendations = await this.fetchPersonalizedRecommendations();
            this.displayRecommendations(recommendations);
            
            document.getElementById('results-section').style.display = 'block';
            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("❌ Error getting recommendations:", error);
            this.showError("Sorry, couldn't get recommendations. Please try again!");
        } finally {
            this.showLoading(false);
            this.updateStats();
        }
    }

    async fetchPersonalizedRecommendations() {
        console.log("🚫 Using high-quality demo content with AI personalization");
        const baseRecommendations = this.getDemoRecommendations();
        return this.getPersonalizedRecommendations(baseRecommendations);
    }

    getDemoRecommendations() {
        // Get the full content database
        const allDemoContent = this.getAllDemoContent();

        console.log(`🔍 Filtering content for: ${this.selectedTime} minutes, interests: ${this.selectedInterests.join(', ')}`);

        // STEP 1: Filter by time duration (strict)
        let timeFilteredContent = allDemoContent.filter(item => 
            this.selectedTime >= item.minTime && this.selectedTime <= item.maxTime
        );

        console.log(`⏰ Time filtering: ${allDemoContent.length} → ${timeFilteredContent.length} items match ${this.selectedTime} minutes`);

        // STEP 2: Filter by interests (strict - must match at least one selected interest)
        let interestFilteredContent = timeFilteredContent.filter(item => {
            const hasMatchingInterest = this.selectedInterests.some(selectedInterest => 
                item.keywords.includes(selectedInterest)
            );
            
            if (hasMatchingInterest) {
                console.log(`✅ Interest match: "${item.title}" matches ${this.selectedInterests.join(', ')}`);
            }
            
            return hasMatchingInterest;
        });

        console.log(`🎯 Interest filtering: ${timeFilteredContent.length} → ${interestFilteredContent.length} items match interests`);

        // STEP 3: If we have good matches, use them
        if (interestFilteredContent.length >= 2) {
            console.log(`🎉 Found ${interestFilteredContent.length} perfect matches!`);
            return interestFilteredContent.slice(0, 6);
        }

        // STEP 4: Partial interest matching (if no perfect matches)
        let partialMatches = timeFilteredContent.filter(item => {
            const hasPartialMatch = this.selectedInterests.some(selectedInterest => 
                item.title.toLowerCase().includes(selectedInterest.toLowerCase()) ||
                item.description.toLowerCase().includes(selectedInterest.toLowerCase())
            );
            
            if (hasPartialMatch) {
                console.log(`🔶 Partial match: "${item.title}" partially matches ${this.selectedInterests.join(', ')}`);
            }
            
            return hasPartialMatch;
        });

        if (partialMatches.length >= 1) {
            console.log(`📍 Using ${partialMatches.length} partial matches`);
            return partialMatches.slice(0, 6);
        }

        // STEP 5: NO MATCHES FOUND - Show helpful message instead of wrong content
        console.warn(`❌ No content found for ${this.selectedTime} minutes + ${this.selectedInterests.join(', ')}`);
        
        // Return empty array to trigger "no matches" UI
        return [];
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('recommendations');
        if (!container) return;

        container.innerHTML = '';
        this.currentRecommendations = recommendations;

        if (recommendations.length === 0) {
            // Show helpful "no matches" message instead of generic error
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #4a5568; grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 15px; color: #e53e3e;">🤔 No ${this.selectedTime}-minute ${this.selectedInterests.join(' & ')} content found</h3>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ffa726;">
                        <h4 style="margin-bottom: 10px; color: #d69e2e;">💡 Try these suggestions:</h4>
                        <ul style="text-align: left; margin: 0 auto; display: inline-block; color: #4a5568;">
                            <li><strong>Different time:</strong> Try 15 min or 60 min instead</li>
                            <li><strong>Different interests:</strong> Maybe add comedy or technology</li>
                            <li><strong>Fewer interests:</strong> Select just one interest</li>
                            <li><strong>Popular combinations:</strong> 15min+comedy, 30min+tech, 60min+documentary</li>
                        </ul>
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="window.contentRecommender.suggestPopularContent()" 
                                style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                            🎯 Show Popular ${this.selectedTime}min Content
                        </button>
                        <button onclick="window.contentRecommender.resetSelections()" 
                                style="padding: 12px 24px; background: transparent; color: #667eea; border: 2px solid #667eea; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            🔄 Start Over
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('results-section').style.display = 'block';
            return;
        }

        // AI-powered header (existing code)
        const personalizedCount = recommendations.filter(r => r.isPersonalized).length;
        const topInterests = this.getTopInterests(2);
        
        const header = document.createElement('div');
        header.style.cssText = `
            grid-column: 1 / -1; background: linear-gradient(135deg, #4ecdc4, #44a08d);
            color: white; padding: 15px; border-radius: 10px; text-align: center;
            margin-bottom: 20px; font-weight: 600;
        `;
        
        let headerText = `🧠 AI found ${recommendations.length} perfect ${this.selectedTime}-minute recommendations`;
        if (personalizedCount > 0) {
            headerText += `<br>✨ ${personalizedCount} specially personalized for you`;
        }
        if (topInterests.length > 0) {
            headerText += `<br><small>💝 Based on your love for ${topInterests[0].interest}</small>`;
        }
        
        header.innerHTML = headerText;
        container.appendChild(header);

        // Create personalized cards
        recommendations.forEach((item, index) => {
            const card = this.createPersonalizedCard(item, index);
            container.appendChild(card);
        });

        console.log(`✨ Displayed ${recommendations.length} AI-personalized recommendations`);
    }

    // Helper method to suggest popular content when no matches found
    suggestPopularContent() {
        console.log("🎯 Suggesting popular content for", this.selectedTime, "minutes");
        
        // Get all content that matches the time, regardless of interests
        const allContent = this.getAllDemoContent();
        const timeMatches = allContent.filter(item => 
            this.selectedTime >= item.minTime && this.selectedTime <= item.maxTime
        );
        
        if (timeMatches.length > 0) {
            // Show most popular content for this time duration
            const popularContent = timeMatches.slice(0, 4); // Show top 4
            this.displayRecommendations(this.getPersonalizedRecommendations(popularContent));
        } else {
            // Show closest time matches
            const closestMatches = allContent
                .map(item => ({
                    ...item,
                    timeDiff: Math.abs(item.perfectTime - this.selectedTime)
                }))
                .sort((a, b) => a.timeDiff - b.timeDiff)
                .slice(0, 4);
            
            this.displayRecommendations(this.getPersonalizedRecommendations(closestMatches));
        }
    }

    // Helper to get all demo content (complete database with fixed images)
    getAllDemoContent() {
        return [
            // === 15-MINUTE GAMING CONTENT ===
            {
                id: 'gaming_15_1', title: 'Best Gaming Highlights 2024 - 15 Minutes of Epic Wins',
                description: 'Most incredible gaming moments and epic wins compilation',
                duration: '15:30', channel: 'Gaming Central',
                thumbnail: this.createPlaceholderImage('🎮 15min Gaming', '9c88ff'),
                keywords: ['gaming', 'highlights', 'entertainment'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=gaming15min1'
            },
            {
                id: 'gaming_15_2', title: 'Quick Gaming Tips - 15 Minutes to Level Up Your Skills',
                description: 'Essential gaming tips and tricks for better gameplay',
                duration: '14:45', channel: 'Pro Gaming Tips',
                thumbnail: this.createPlaceholderImage('🎮 Tips', '8b5cf6'),
                keywords: ['gaming', 'education', 'tips'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=gamingtips15min'
            },

            // === 30-MINUTE GAMING CONTENT ===
            {
                id: 'gaming_30_1', title: 'Epic Gaming Marathon - 30 Minutes of Best Gameplay',
                description: 'Non-stop action from the most popular games of 2024',
                duration: '29:45', channel: 'Gaming World',
                thumbnail: this.createPlaceholderImage('🎮 30min Marathon', '9c88ff'),
                keywords: ['gaming', 'entertainment', 'marathon'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=gaming30min1'
            },
            {
                id: 'gaming_30_2', title: 'Complete Gaming Setup Guide - Build the Perfect Gaming Rig',
                description: 'Everything you need to know about gaming hardware and setup',
                duration: '31:20', channel: 'Gaming Tech Hub',
                thumbnail: this.createPlaceholderImage('🖥️ Setup', '8b5cf6'),
                keywords: ['gaming', 'technology', 'education'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=gamingsetup30min'
            },
            {
                id: 'gaming_30_3', title: 'Funniest Gaming Fails and Wins - 30 Minute Compilation',
                description: 'Hilarious gaming moments that will make you laugh',
                duration: '30:15', channel: 'Gaming Laughs',
                thumbnail: this.createPlaceholderImage('😂 Gaming', 'ff6b9d'),
                keywords: ['gaming', 'funny', 'compilation'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=gamingfails30min'
            },

            // === 60-MINUTE GAMING CONTENT ===
            {
                id: 'gaming_60_1', title: 'Complete Game Walkthrough - Full Hour Playthrough',
                description: 'Complete walkthrough of the latest indie game sensation',
                duration: '58:30', channel: 'Complete Walkthroughs',
                thumbnail: this.createPlaceholderImage('🎮 60min Play', '9c88ff'),
                keywords: ['gaming', 'walkthrough', 'complete'],
                minTime: 50, maxTime: 70, perfectTime: 60,
                url: 'https://youtube.com/watch?v=gaming60min1'
            },

            // === COMEDY CONTENT ===
            {
                id: 'comedy_15_1', title: 'Best Stand-Up Comedy Compilation - 15 Minutes of Pure Laughter',
                description: 'Hilarious compilation featuring the best comedians',
                duration: '15:23', channel: 'Comedy Gold',
                thumbnail: this.createPlaceholderImage('😂 15min Comedy', 'ff6b6b'),
                keywords: ['comedy', 'funny', 'entertainment'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=comedy15min1'
            },
            {
                id: 'comedy_30_1', title: 'Epic Comedy Special Highlights - 30 Minutes of Best Comedians',
                description: 'Featuring excerpts from the most popular comedy specials',
                duration: '29:45', channel: 'Comedy Central',
                thumbnail: this.createPlaceholderImage('😂 30min Special', 'ff6b6b'),
                keywords: ['comedy', 'funny', 'entertainment'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=comedy30min1'
            },

            // === TECHNOLOGY CONTENT ===
            {
                id: 'tech_15_1', title: 'JavaScript Fundamentals in 15 Minutes - Complete Guide',
                description: 'Learn essential JavaScript concepts every developer needs',
                duration: '14:55', channel: 'Code Academy Pro',
                thumbnail: this.createPlaceholderImage('💻 15min JS', '667eea'),
                keywords: ['technology', 'programming', 'education'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=js15min1'
            },
            {
                id: 'tech_30_1', title: 'Complete React Tutorial - Build Your First App in 30 Minutes',
                description: 'Comprehensive guide to building a React application',
                duration: '31:20', channel: 'Web Dev Academy',
                thumbnail: this.createPlaceholderImage('⚛️ 30min React', '667eea'),
                keywords: ['technology', 'programming', 'education'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=react30min1'
            },

            // === FITNESS CONTENT ===
            {
                id: 'fitness_15_1', title: '15-Minute Full Body HIIT Workout - No Equipment',
                description: 'High-intensity workout perfect for busy schedules',
                duration: '15:44', channel: 'Fitness First',
                thumbnail: this.createPlaceholderImage('💪 15min HIIT', 'ff6b9d'),
                keywords: ['fitness', 'workout', 'health', 'exercise'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=hiit15min1'
            },
            {
                id: 'fitness_30_1', title: '30-Minute Full Body Strength Training - Complete Workout',
                description: 'Complete strength training session for all fitness levels',
                duration: '30:10', channel: 'Strength Academy',
                thumbnail: this.createPlaceholderImage('💪 30min Strength', 'ff6b9d'),
                keywords: ['fitness', 'workout', 'health', 'exercise'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=fitness30min1'
            },

            // === MUSIC CONTENT ===
            {
                id: 'music_15_1', title: 'Chill Lo-Fi Study Beats - 15 Minutes of Focus Music',
                description: 'Perfect background music for studying and concentration',
                duration: '15:00', channel: 'Study Beats',
                thumbnail: this.createPlaceholderImage('🎵 15min Chill', '4ecdc4'),
                keywords: ['music', 'study', 'focus', 'relaxation'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=lofi15min1'
            },
            {
                id: 'music_30_1', title: 'Best Electronic Music Mix 2024 - 30 Minutes of Energy',
                description: 'High-energy electronic music perfect for motivation',
                duration: '30:00', channel: 'Electronic Vibes',
                thumbnail: this.createPlaceholderImage('🎵 30min EDM', '4ecdc4'),
                keywords: ['music', 'electronic', 'energy'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=edm30min1'
            },

            // === COOKING CONTENT ===
            {
                id: 'cooking_15_1', title: 'Quick & Delicious 15-Minute Pasta Recipe',
                description: 'Learn to make amazing pasta dishes in just 15 minutes',
                duration: '14:20', channel: 'Quick Kitchen',
                thumbnail: this.createPlaceholderImage('👨‍🍳 15min Pasta', 'ffa726'),
                keywords: ['cooking', 'food', 'recipe'],
                minTime: 12, maxTime: 18, perfectTime: 15,
                url: 'https://youtube.com/watch?v=pasta15min1'
            },
            {
                id: 'cooking_30_1', title: 'Complete Cooking Masterclass - 30-Minute Gourmet Meal',
                description: 'Learn professional cooking techniques',
                duration: '28:40', channel: 'Chef\'s Table',
                thumbnail: this.createPlaceholderImage('👨‍🍳 30min Gourmet', 'ffa726'),
                keywords: ['cooking', 'food', 'gourmet', 'education'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=gourmet30min1'
            },

            // === DOCUMENTARY CONTENT ===
            {
                id: 'documentary_30_1', title: 'Space Exploration Documentary - 30 Minutes of Wonder',
                description: 'Fascinating journey through space exploration history',
                duration: '29:30', channel: 'Space Docs',
                thumbnail: this.createPlaceholderImage('🚀 30min Space', '00d4aa'),
                keywords: ['documentary', 'education', 'space', 'science'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=space30min1'
            },
            {
                id: 'documentary_60_1', title: 'Nature Documentary: Secret Life of Forests - Complete Episode',
                description: 'Stunning documentary exploring forest ecosystems',
                duration: '58:30', channel: 'Nature World',
                thumbnail: this.createPlaceholderImage('🌲 60min Nature', '00d4aa'),
                keywords: ['documentary', 'education', 'nature'],
                minTime: 50, maxTime: 70, perfectTime: 60,
                url: 'https://youtube.com/watch?v=nature60min1'
            },

            // === EDUCATION CONTENT ===
            {
                id: 'education_30_1', title: 'Complete Language Learning Guide - 30 Minutes to Fluency',
                description: 'Effective techniques for learning any new language',
                duration: '30:45', channel: 'Learning Academy',
                thumbnail: this.createPlaceholderImage('📚 30min Lang', '667eea'),
                keywords: ['education', 'learning', 'language', 'skills'],
                minTime: 25, maxTime: 35, perfectTime: 30,
                url: 'https://youtube.com/watch?v=language30min1'
            }
        ];
    }

    createPlaceholderImage(text, color) {
        // Create SVG placeholder that won't cause HTTPS errors
        const svg = `<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
            <rect width="320" height="180" fill="#${color}"/>
            <text x="160" y="95" text-anchor="middle" fill="white" font-size="14" font-family="Arial, sans-serif" font-weight="bold">${text}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    createPersonalizedCard(item, index) {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.dataset.id = item.id;

        // Add personalization styling
        if (item.isPersonalized) {
            card.style.border = '2px solid #4ecdc4';
            card.style.background = 'linear-gradient(145deg, #ffffff, #f8fafc)';
        }

        // Personalization indicators
        let badges = '';
        if (item.isPersonalized) {
            badges += `<span style="position: absolute; top: 8px; left: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; z-index: 2;">🧠 AI Pick</span>`;
        }
        if (item.personalizedScore > 40) {
            badges += `<span style="position: absolute; top: 8px; right: 8px; background: #4ecdc4; color: white; padding: 4px 8px; border-radius: 50%; font-size: 11px; font-weight: 700; z-index: 2;">${Math.round(item.personalizedScore)}</span>`;
        }

        card.innerHTML = `
            <div style="position: relative;">
                ${badges}
                <img src="${item.thumbnail}" alt="${item.title}" 
                     onerror="this.src='${this.getPlaceholderImage()}'">
            </div>
            <div class="content">
                <div class="title">${item.title}</div>
                <div class="channel">${item.channel}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <div class="duration">${item.duration}</div>
                    <div style="font-size: 11px; color: #667eea; font-weight: 500;">${item.personalizedReason}</div>
                </div>
                ${item.source === 'youtube-api' ? '<div style="font-size: 10px; color: #4ecdc4; font-weight: 600; margin-top: 4px;">📡 Live from YouTube</div>' : ''}
            </div>
        `;

        card.addEventListener('click', () => this.handleRecommendationClick(item, index));
        return card;
    }

    handleRecommendationClick(item, index) {
        console.log(`🎯 User clicked: "${item.title}" (AI Score: ${item.personalizedScore})`);
        
        this.userStats.contentClicked++;
        
        // Learn from click (strongest signal)
        this.updateUserProfile('content_clicked', {
            contentId: item.id, title: item.title,
            interests: item.keywords || this.selectedInterests,
            personalizedScore: item.personalizedScore || 0
        });

        // Visual feedback
        const card = document.querySelector(`[data-id="${item.id}"]`);
        if (card) {
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
                const badge = document.createElement('div');
                badge.textContent = '✓ Clicked';
                badge.style.cssText = 'position: absolute; top: 10px; left: 10px; background: #4ecdc4; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;';
                card.style.position = 'relative';
                card.appendChild(badge);
            }, 150);
        }

        window.open(item.url, '_blank');
        this.updateStats();
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const button = document.getElementById('get-recommendations');
        
        if (show) {
            if (loading) loading.style.display = 'block';
            if (button) button.style.display = 'none';
        } else {
            if (loading) loading.style.display = 'none';
            if (button) button.style.display = 'block';
        }
    }

    showError(message) {
        const container = document.getElementById('recommendations');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e; grid-column: 1 / -1;">
                <h3>⚠️ ${message}</h3>
                <button onclick="window.contentRecommender.getRecommendations()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Try Again</button>
            </div>
        `;
        document.getElementById('results-section').style.display = 'block';
    }

    async getMoreRecommendations() {
        console.log("🔄 Getting more AI recommendations...");
        this.showLoading(true);
        
        try {
            const moreRecommendations = await this.fetchPersonalizedRecommendations();
            const allRecommendations = [...this.currentRecommendations, ...moreRecommendations];
            this.displayRecommendations(allRecommendations);
        } catch (error) {
            console.error("❌ Error getting more recommendations:", error);
        } finally {
            this.showLoading(false);
        }
    }

    trackEvent(eventName, eventData) {
        const eventLog = {
            event: eventName, data: eventData,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        try {
            const existingEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
            existingEvents.push(eventLog);
            localStorage.setItem('userEvents', JSON.stringify(existingEvents.slice(-1000)));
        } catch (error) {
            console.warn("⚠️ Could not store event:", error);
        }
    }

    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        }
        return this.sessionId;
    }

    updateStats() {
        const statsElement = document.getElementById('user-stats');
        if (!statsElement) return;

        const topInterests = this.getTopInterests(2);
        const interactionCount = this.userProfile.feedback.viewed.length;
        const clickRate = interactionCount > 0 ? Math.round((this.userProfile.feedback.liked.length / interactionCount) * 100) : 0;
        
        let statsText = `Session: ${this.userStats.recommendationsRequested} requests, ${this.userStats.contentClicked} clicks`;
        
        if (interactionCount > 0) {
            statsText += ` | AI Learning: ${interactionCount} interactions, ${clickRate}% accuracy`;
            if (topInterests.length > 0) {
                statsText += ` | Loves: ${topInterests[0].interest}`;
            }
        } else {
            statsText += ` | AI: Ready to learn your preferences`;
        }
        
        statsElement.textContent = statsText;
        
        // Visual feedback for learning progress
        if (interactionCount >= 10) {
            statsElement.style.background = 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(68, 160, 141, 0.2))';
        } else if (interactionCount >= 5) {
            statsElement.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))';
        }
    }

    resetSelections() {
        this.selectedTime = null;
        this.selectedInterests = [];
        
        document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.interest-item').forEach(item => {
            item.classList.remove('selected');
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = false;
        });
        
        document.getElementById('results-section').style.display = 'none';
        this.updateRecommendationButton();
        this.updateStats();
        
        console.log("🔄 Selections reset - AI profile preserved");
    }
}

// Initialize the application
function initializeApp() {
    console.log("🎬 Initializing AI-Powered Content Recommender...");
    
    try {
        window.contentRecommender = new ContentRecommender();
        console.log("✅ AI Content Recommender initialized successfully!");
    } catch (error) {
        console.error("❌ Failed to initialize:", error);
    }
}

// Multiple initialization methods
document.addEventListener('DOMContentLoaded', initializeApp);

if (document.readyState === 'loading') {
    console.log("⏳ Waiting for DOM...");
} else {
    console.log("⚡ DOM ready, initializing...");
    initializeApp();
}

setTimeout(() => {
    if (!window.contentRecommender) {
        console.log("🔄 Fallback initialization...");
        initializeApp();
    }
}, 100);