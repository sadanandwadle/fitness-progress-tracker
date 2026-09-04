// ========================================
// WORKOUT.JS - Workout & Personal Records
// ========================================

const WorkoutTracker = {
    init: function() {
        this.attachEventListeners();
        this.refresh();
    },

    attachEventListeners: function() {
        const form = document.getElementById('workoutForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddWorkout(e));
        }

        const filter = document.getElementById('bodyPartFilter');
        if (filter) {
            filter.addEventListener('change', () => this.refresh());
        }
    },

    refresh: function() {
        this.renderWorkoutHistory();
        this.updateStats();
        this.renderPersonalRecords();
    },

    handleAddWorkout: function(e) {
        e.preventDefault();

        const date = document.getElementById('workoutDate').value;
        const bodyPart = document.getElementById('workoutBodyPart').value;
        const exerciseName = document.getElementById('exerciseName').value;
        const weight = parseFloat(document.getElementById('exerciseWeight').value);
        const reps = parseInt(document.getElementById('exerciseReps').value);
        const sets = parseInt(document.getElementById('exerciseSets').value);

        // Validation
        if (!date || !bodyPart || !exerciseName || !weight || !reps || !sets) {
            showFormMessage('workoutFormMessage', 'Please fill all fields', 'error');
            return;
        }

        if (weight <= 0 || reps <= 0 || sets <= 0) {
            showFormMessage('workoutFormMessage', 'Values must be greater than 0', 'error');
            return;
        }

        const workout = {
            id: Date.now(),
            date,
            bodyPart,
            exerciseName,
            weight,
            reps,
            sets
        };

        let workouts = StorageManager.load('workouts', []);
        workouts.push(workout);
        workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

        StorageManager.save('workouts', workouts);
        showFormMessage('workoutFormMessage', 'Workout logged successfully!', 'success');

        this.refresh();
        document.getElementById('workoutForm').reset();
        setDefaultDates();
        DashboardManager.refresh();
    },

    renderWorkoutHistory: function() {
        let workouts = StorageManager.load('workouts', []);
        const filter = document.getElementById('bodyPartFilter').value;

        if (filter) {
            workouts = workouts.filter(w => w.bodyPart === filter);
        }

        const container = document.getElementById('workoutHistory');

        if (workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">No workouts logged yet</p>';
            return;
        }

        // Group by date
        const grouped = {};
        workouts.forEach(w => {
            if (!grouped[w.date]) {
                grouped[w.date] = [];
            }
            grouped[w.date].push(w);
        });

        let html = '';
        Object.keys(grouped).sort().reverse().forEach(date => {
            html += `<p style="margin: 15px 0 10px 0; font-weight: 600; color: #6c5ce7;">${formatDate(date)}</p>`;
            
            grouped[date].forEach(workout => {
                html += `
                    <div class="workout-item">
                        <div class="workout-item-header">
                            <div>
                                <p class="workout-exercise">${workout.exerciseName}</p>
                                <p class="workout-details">
                                    ${workout.weight}kg × ${workout.reps} × ${workout.sets} sets
                                </p>
                            </div>
                            <div style="display: flex; gap: 5px;">
                                <span class="workout-body-part">${workout.bodyPart}</span>
                                <button class="btn-small" onclick="WorkoutTracker.deleteWorkout(${workout.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        });

        container.innerHTML = html;
    },

    deleteWorkout: function(id) {
        if (confirm('Delete this workout entry?')) {
            let workouts = StorageManager.load('workouts', []);
            workouts = workouts.filter(w => w.id !== id);
            StorageManager.save('workouts', workouts);
            this.refresh();
            DashboardManager.refresh();
            showFormMessage('workoutFormMessage', 'Workout deleted', 'success');
        }
    },

    updateStats: function() {
        const workouts = StorageManager.load('workouts', []);
        const today = getTodayDate();

        // Total workouts
        document.getElementById('totalWorkouts').textContent = workouts.length;

        // This month
        const thisMonth = workouts.filter(w => {
            const wDate = new Date(w.date);
            const today = new Date();
            return wDate.getMonth() === today.getMonth() && 
                   wDate.getFullYear() === today.getFullYear();
        }).length;

        document.getElementById('monthWorkouts').textContent = thisMonth;
    },

    renderPersonalRecords: function() {
        const workouts = StorageManager.load('workouts', []);
        
        if (workouts.length === 0) {
            document.getElementById('prList').innerHTML = 
                '<p class="empty-state">No exercises recorded yet</p>';
            return;
        }

        // Get PR for each exercise
        const prMap = {};
        workouts.forEach(w => {
            if (!prMap[w.exerciseName]) {
                prMap[w.exerciseName] = w.weight;
            } else {
                prMap[w.exerciseName] = Math.max(prMap[w.exerciseName], w.weight);
            }
        });

        const prList = Object.entries(prMap)
            .sort((a, b) => b[1] - a[1])
            .map(([exercise, weight]) => `
                <div class="pr-item">
                    <p class="pr-exercise">${exercise}</p>
                    <p class="pr-weight">${weight}</p>
                    <p class="pr-unit">kg</p>
                </div>
            `).join('');

        document.getElementById('prList').innerHTML = prList;
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    WorkoutTracker.init();
});