// ========================================
// APP.JS - Main Application Controller
// ========================================

// ========================================
// LOCALSTORAGE UTILITIES
// ========================================

const StorageManager = {
    // Save data to LocalStorage
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    // Load data from LocalStorage
    load: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    },

    // Delete specific key
    delete: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            return false;
        }
    },

    // Clear all application data
    clearAll: function() {
        try {
            const keysToKeep = ['theme']; // Keep theme preference
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// ========================================
// THEME MANAGER
// ========================================

const ThemeManager = {
    init: function() {
        const savedTheme = StorageManager.load('theme', 'light');
        this.setTheme(savedTheme);
        this.attachEventListeners();
    },

    setTheme: function(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            StorageManager.save('theme', 'dark');
            this.updateToggleIcon('light');
        } else {
            document.body.classList.remove('dark-mode');
            StorageManager.save('theme', 'light');
            this.updateToggleIcon('dark');
        }
    },

    toggleTheme: function() {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    updateToggleIcon: function(nextTheme) {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            if (nextTheme === 'dark') {
                toggle.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                toggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    },

    attachEventListeners: function() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleTheme());
        }
    }
};

// ========================================
// NAVIGATION MANAGER
// ========================================

const NavigationManager = {
    init: function() {
        this.attachEventListeners();
        this.showSection('dashboard');
    },

    attachEventListeners: function() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
                this.closeMobileMenu();
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const nav = document.querySelector('.sidebar-nav');
                nav.classList.toggle('active');
            });
        }
    },

    showSection: function(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });

        // Refresh section-specific data
        if (sectionId === 'dashboard') {
            DashboardManager.refresh();
        } else if (sectionId === 'weight') {
            WeightTracker.refresh();
        } else if (sectionId === 'workouts') {
            WorkoutTracker.refresh();
        } else if (sectionId === 'nutrition') {
            NutritionTracker.refresh();
        } else if (sectionId === 'measurements') {
            MeasurementTracker.refresh();
        } else if (sectionId === 'goals') {
            GoalTracker.refresh();
        }
    },

    closeMobileMenu: function() {
        const nav = document.querySelector('.sidebar-nav');
        if (nav) {
            nav.classList.remove('active');
        }
    }
};

// ========================================
// DASHBOARD MANAGER
// ========================================

const DashboardManager = {
    refresh: function() {
        this.updateStats();
        this.updateWeightProgress();
        this.updateRecentActivities();
        this.updateWeightChart();
    },

    updateStats: function() {
        const weights = StorageManager.load('weights', []);
        const nutrition = StorageManager.load('todayNutrition', {});
        const goals = StorageManager.load('goals', {});

        // Current weight
        const currentWeight = weights.length > 0 
            ? weights[weights.length - 1].weight 
            : '--';
        document.getElementById('dashCurrentWeight').textContent = 
            currentWeight !== '--' ? currentWeight + ' kg' : currentWeight;

        // Goal weight
        const goalWeight = goals.targetWeight || '--';
        document.getElementById('dashGoalWeight').textContent = 
            goalWeight !== '--' ? goalWeight + ' kg' : goalWeight;

        // Weight change
        if (weights.length > 0) {
            const firstWeight = weights[0].weight;
            const lastWeight = weights[weights.length - 1].weight;
            const change = (lastWeight - firstWeight).toFixed(1);
            const changeElement = document.getElementById('dashWeightChange');
            changeElement.textContent = change + ' kg';
            
            if (change < 0) {
                changeElement.style.color = '#00b894';
            } else if (change > 0) {
                changeElement.style.color = '#d63031';
            }
        }

        // Calories
        const calories = nutrition.calories || 0;
        document.getElementById('dashCalories').textContent = calories + ' kcal';

        // Protein
        const protein = nutrition.protein || 0;
        document.getElementById('dashProtein').textContent = protein + ' g';

        // Water
        const water = nutrition.water || 0;
        document.getElementById('dashWater').textContent = water + ' L';
    },

    updateWeightProgress: function() {
        const goals = StorageManager.load('goals', {});
        const weights = StorageManager.load('weights', []);

        if (goals.currentWeight && goals.targetWeight) {
            const current = parseFloat(goals.currentWeight);
            const target = parseFloat(goals.targetWeight);
            const total = Math.abs(target - current);
            
            let lost = 0;
            if (weights.length > 0) {
                const firstWeight = weights[0].weight;
                lost = Math.abs(current - firstWeight);
            } else {
                lost = Math.abs(current - target);
            }

            const percentage = total > 0 ? (lost / total) * 100 : 0;

            document.getElementById('dashProgressPercent').textContent = 
                Math.min(100, Math.round(percentage)) + '%';
            
            const progressBar = document.getElementById('dashProgressBar');
            progressBar.style.width = Math.min(100, percentage) + '%';

            const progressText = document.getElementById('dashProgressText');
            if (percentage >= 100) {
                progressText.textContent = '🎉 Goal Achieved!';
            } else {
                const remaining = (total - lost).toFixed(1);
                progressText.textContent = `${remaining} kg remaining to goal`;
            }
        } else {
            document.getElementById('dashProgressPercent').textContent = '0%';
            document.getElementById('dashProgressBar').style.width = '0%';
            document.getElementById('dashProgressText').textContent = 'Set your goals to get started';
        }
    },

    updateRecentActivities: function() {
        const weights = StorageManager.load('weights', []);
        const workouts = StorageManager.load('workouts', []);
        const nutrition = StorageManager.load('nutritionHistory', []);

        const allActivities = [];

        weights.forEach(w => {
            allActivities.push({
                date: new Date(w.date),
                text: `Weight: ${w.weight} kg`
            });
        });

        workouts.forEach(w => {
            allActivities.push({
                date: new Date(w.date),
                text: `Workout: ${w.exerciseName} (${w.bodyPart})`
            });
        });

        nutrition.forEach(n => {
            allActivities.push({
                date: new Date(n.date),
                text: `Nutrition: ${n.calories} kcal`
            });
        });

        // Sort by date descending and get last 5
        allActivities.sort((a, b) => b.date - a.date);
        const recent = allActivities.slice(0, 5);

        const container = document.getElementById('recentActivities');
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No activities yet. Start tracking!</p>';
        } else {
            container.innerHTML = recent.map(activity => `
                <div class="activity-item">
                    <p>${activity.text}</p>
                    <p class="activity-date">${activity.date.toLocaleDateString()}</p>
                </div>
            `).join('');
        }
    },

    updateWeightChart: function() {
        const weights = StorageManager.load('weights', []);
        
        if (weights.length === 0) {
            const ctx = document.getElementById('weightChart');
            if (ctx) {
                ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            }
            return;
        }

        const dates = weights.map(w => {
            const date = new Date(w.date);
            return date.toLocaleDateString('en-GB', { 
                month: 'short', 
                day: 'numeric' 
            });
        });

        const values = weights.map(w => w.weight);

        const ctx = document.getElementById('weightChart');
        if (ctx && window.Chart) {
            // Destroy existing chart if it exists
            if (window.dashboardWeightChart) {
                window.dashboardWeightChart.destroy();
            }

            window.dashboardWeightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Weight (kg)',
                        data: values,
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108, 92, 231, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#6c5ce7',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                color: '#7f8c8d'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#7f8c8d'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize demo data if first time
    initializeDemoData();

    // Initialize managers
    ThemeManager.init();
    NavigationManager.init();
    
    // Set today's date as default in date inputs
    setDefaultDates();

    // Clear all data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
                StorageManager.clearAll();
                // Reload to refresh UI
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            }
        });
    }

    // Initial dashboard refresh
    DashboardManager.refresh();
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

function showFormMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = 'form-message ' + type;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageEl.className = 'form-message';
        }, 3000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// ========================================
// DEMO DATA
// ========================================

function initializeDemoData() {
    const hasData = StorageManager.load('hasInitialized', false);
    
    if (!hasData) {
        const demoWeights = [
            { date: '2024-08-29', weight: 81.8 },
            { date: '2024-09-01', weight: 81.2 },
            { date: '2024-09-05', weight: 80.7 },
            { date: '2024-09-08', weight: 80.2 }
        ];

        const demoWorkouts = [
            {
                date: '2024-09-05',
                bodyPart: 'Chest',
                exerciseName: 'Bench Press',
                weight: 80,
                reps: 8,
                sets: 3
            },
            {
                date: '2024-09-05',
                bodyPart: 'Chest',
                exerciseName: 'Incline Dumbbell Press',
                weight: 20,
                reps: 10,
                sets: 3
            },
            {
                date: '2024-09-07',
                bodyPart: 'Legs',
                exerciseName: 'Squat',
                weight: 100,
                reps: 6,
                sets: 4
            },
            {
                date: '2024-09-07',
                bodyPart: 'Legs',
                exerciseName: 'Leg Press',
                weight: 150,
                reps: 10,
                sets: 3
            }
        ];

        const demoNutrition = [
            {
                date: '2024-09-08',
                calories: 1850,
                protein: 150,
                carbs: 180,
                fat: 55,
                water: 2.8
            }
        ];

        const demoMeasurements = [
            {
                date: '2024-09-01',
                chest: 100,
                waist: 85,
                arms: 32,
                shoulders: 120,
                thighs: 60
            }
        ];

        const demoGoals = {
            currentWeight: 81.8,
            targetWeight: 75
        };

        const demoTargets = {
            calories: 2000,
            protein: 160,
            carbs: 250,
            fat: 70,
            water: 3.5
        };

        StorageManager.save('weights', demoWeights);
        StorageManager.save('workouts', demoWorkouts);
        StorageManager.save('nutritionHistory', demoNutrition);
        StorageManager.save('measurements', demoMeasurements);
        StorageManager.save('goals', demoGoals);
        StorageManager.save('nutritionTargets', demoTargets);
        StorageManager.save('hasInitialized', true);
    }
}