// ========================================
// PROGRESS.JS - Weight, Measurements & Goals
// ========================================

// ========================================
// WEIGHT TRACKER
// ========================================

const WeightTracker = {
    init: function() {
        this.attachEventListeners();
        this.refresh();
    },

    attachEventListeners: function() {
        const form = document.getElementById('weightForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddWeight(e));
        }
    },

    refresh: function() {
        this.renderWeightHistory();
        this.updateWeightChart();
    },

    handleAddWeight: function(e) {
        e.preventDefault();

        const date = document.getElementById('weightDate').value;
        const weight = parseFloat(document.getElementById('weightValue').value);

        // Validation
        if (!date || !weight) {
            showFormMessage('weightFormMessage', 'Please fill all fields', 'error');
            return;
        }

        if (weight <= 0) {
            showFormMessage('weightFormMessage', 'Weight must be greater than 0', 'error');
            return;
        }

        // Load existing weights
        let weights = StorageManager.load('weights', []);

        // Check if entry already exists for this date
        const existingIndex = weights.findIndex(w => w.date === date);
        if (existingIndex !== -1) {
            weights[existingIndex] = { date, weight };
            showFormMessage('weightFormMessage', 'Weight entry updated', 'success');
        } else {
            weights.push({ date, weight });
            weights.sort((a, b) => new Date(a.date) - new Date(b.date));
            showFormMessage('weightFormMessage', 'Weight entry added', 'success');
        }

        // Save and refresh
        StorageManager.save('weights', weights);
        
        // Also update dashboard stats if we changed weight
        if (StorageManager.load('goals', {}).currentWeight === undefined) {
            const goals = StorageManager.load('goals', {});
            goals.currentWeight = weight;
            StorageManager.save('goals', goals);
        }

        this.refresh();
        document.getElementById('weightForm').reset();
        setDefaultDates();

        // Refresh dashboard
        DashboardManager.refresh();
    },

    renderWeightHistory: function() {
        const weights = StorageManager.load('weights', []);
        const tbody = document.getElementById('weightTableBody');

        if (weights.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No weight entries yet</td></tr>';
            return;
        }

        tbody.innerHTML = weights.map((entry, index) => {
            let change = '--';
            if (index > 0) {
                const diff = entry.weight - weights[index - 1].weight;
                change = (diff > 0 ? '+' : '') + diff.toFixed(1) + ' kg';
            }

            return `
                <tr>
                    <td>${formatDate(entry.date)}</td>
                    <td>${entry.weight} kg</td>
                    <td>${change}</td>
                    <td>
                        <button class="btn-danger" onclick="WeightTracker.deleteWeight('${entry.date}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    deleteWeight: function(date) {
        if (confirm('Delete this weight entry?')) {
            let weights = StorageManager.load('weights', []);
            weights = weights.filter(w => w.date !== date);
            StorageManager.save('weights', weights);
            this.refresh();
            DashboardManager.refresh();
            showFormMessage('weightFormMessage', 'Entry deleted', 'success');
        }
    },

    updateWeightChart: function() {
        const weights = StorageManager.load('weights', []);
        
        if (weights.length === 0) {
            const ctx = document.getElementById('weightProgressChart');
            if (ctx) {
                ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            }
            return;
        }

        const dates = weights.map(w => {
            const date = new Date(w.date);
            return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        });

        const values = weights.map(w => w.weight);

        const ctx = document.getElementById('weightProgressChart');
        if (ctx && window.Chart) {
            if (window.weightProgressChart) {
                window.weightProgressChart.destroy();
            }

            window.weightProgressChart = new Chart(ctx, {
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
                        pointRadius: 6,
                        pointBackgroundColor: '#6c5ce7',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
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
// MEASUREMENT TRACKER
// ========================================

const MeasurementTracker = {
    init: function() {
        this.attachEventListeners();
        this.refresh();
    },

    attachEventListeners: function() {
        const form = document.getElementById('measurementForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddMeasurement(e));
        }
    },

    refresh: function() {
        this.renderLatestMeasurements();
        this.renderMeasurementHistory();
    },

    handleAddMeasurement: function(e) {
        e.preventDefault();

        const date = document.getElementById('measurementDate').value;
        const chest = parseFloat(document.getElementById('chestMeasurement').value) || 0;
        const waist = parseFloat(document.getElementById('waistMeasurement').value) || 0;
        const arms = parseFloat(document.getElementById('armsMeasurement').value) || 0;
        const shoulders = parseFloat(document.getElementById('shouldersMeasurement').value) || 0;
        const thighs = parseFloat(document.getElementById('thighsMeasurement').value) || 0;

        // Validation
        if (!date) {
            showFormMessage('measurementFormMessage', 'Please select a date', 'error');
            return;
        }

        if (chest <= 0 && waist <= 0 && arms <= 0 && shoulders <= 0 && thighs <= 0) {
            showFormMessage('measurementFormMessage', 'Please enter at least one measurement', 'error');
            return;
        }

        let measurements = StorageManager.load('measurements', []);

        const existingIndex = measurements.findIndex(m => m.date === date);
        if (existingIndex !== -1) {
            measurements[existingIndex] = { date, chest, waist, arms, shoulders, thighs };
            showFormMessage('measurementFormMessage', 'Measurements updated', 'success');
        } else {
            measurements.push({ date, chest, waist, arms, shoulders, thighs });
            measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
            showFormMessage('measurementFormMessage', 'Measurements recorded', 'success');
        }

        StorageManager.save('measurements', measurements);
        this.refresh();
        document.getElementById('measurementForm').reset();
        setDefaultDates();
    },

    renderLatestMeasurements: function() {
        const measurements = StorageManager.load('measurements', []);
        
        if (measurements.length === 0) {
            return;
        }

        const latest = measurements[measurements.length - 1];
        const container = document.getElementById('latestMeasurements');

        const values = [
            { label: 'Chest', value: latest.chest },
            { label: 'Waist', value: latest.waist },
            { label: 'Arms', value: latest.arms },
            { label: 'Shoulders', value: latest.shoulders },
            { label: 'Thighs', value: latest.thighs }
        ];

        container.innerHTML = values.map(v => `
            <div class="measurement-card">
                <p class="measurement-label">${v.label}</p>
                <p class="measurement-value">${v.value || '--'}</p>
                <p class="measurement-unit">cm</p>
            </div>
        `).join('');
    },

    renderMeasurementHistory: function() {
        const measurements = StorageManager.load('measurements', []);
        const tbody = document.getElementById('measurementTableBody');

        if (measurements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No measurements recorded yet</td></tr>';
            return;
        }

        tbody.innerHTML = measurements.map(m => `
            <tr>
                <td>${formatDate(m.date)}</td>
                <td>${m.chest || '--'}</td>
                <td>${m.waist || '--'}</td>
                <td>${m.arms || '--'}</td>
                <td>${m.shoulders || '--'}</td>
                <td>${m.thighs || '--'}</td>
                <td>
                    <button class="btn-danger" onclick="MeasurementTracker.deleteMeasurement('${m.date}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    deleteMeasurement: function(date) {
        if (confirm('Delete this measurement entry?')) {
            let measurements = StorageManager.load('measurements', []);
            measurements = measurements.filter(m => m.date !== date);
            StorageManager.save('measurements', measurements);
            this.refresh();
            showFormMessage('measurementFormMessage', 'Entry deleted', 'success');
        }
    }
};

// ========================================
// GOAL TRACKER
// ========================================

const GoalTracker = {
    init: function() {
        this.attachEventListeners();
        this.refresh();
    },

    attachEventListeners: function() {
        const form = document.getElementById('goalsForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveGoal(e));
        }
    },

    refresh: function() {
        this.displayGoals();
        this.loadFormData();
    },

    handleSaveGoal: function(e) {
        e.preventDefault();

        const currentWeight = parseFloat(document.getElementById('currentWeightGoal').value);
        const targetWeight = parseFloat(document.getElementById('targetWeightGoal').value);

        // Validation
        if (!currentWeight || !targetWeight) {
            showFormMessage('goalsFormMessage', 'Please fill all fields', 'error');
            return;
        }

        if (currentWeight <= 0 || targetWeight <= 0) {
            showFormMessage('goalsFormMessage', 'Weights must be greater than 0', 'error');
            return;
        }

        if (currentWeight === targetWeight) {
            showFormMessage('goalsFormMessage', 'Current and target weight must be different', 'error');
            return;
        }

        const goals = {
            currentWeight,
            targetWeight
        };

        StorageManager.save('goals', goals);
        showFormMessage('goalsFormMessage', 'Goal saved successfully!', 'success');
        
        this.refresh();
        DashboardManager.refresh();
    },

    loadFormData: function() {
        const goals = StorageManager.load('goals', {});
        if (goals.currentWeight) {
            document.getElementById('currentWeightGoal').value = goals.currentWeight;
        }
        if (goals.targetWeight) {
            document.getElementById('targetWeightGoal').value = goals.targetWeight;
        }
    },

    displayGoals: function() {
        const goals = StorageManager.load('goals', {});

        if (!goals.currentWeight || !goals.targetWeight) {
            document.getElementById('goalsCurrentWeight').textContent = '--';
            document.getElementById('goalsTargetWeight').textContent = '--';
            document.getElementById('goalsRemaining').textContent = '--';
            document.getElementById('goalsProgressPercent').textContent = '0%';
            document.getElementById('goalsProgressBar').style.width = '0%';
            document.getElementById('goalsProgressText').textContent = 'Set your goals to get started';
            return;
        }

        const current = parseFloat(goals.currentWeight);
        const target = parseFloat(goals.targetWeight);
        const totalChange = Math.abs(target - current);

        let achieved = Math.abs(current - target);
        const weights = StorageManager.load('weights', []);
        if (weights.length > 0) {
            const firstWeight = weights[0].weight;
            achieved = Math.abs(current - firstWeight);
        }

        const percentage = totalChange > 0 ? (achieved / totalChange) * 100 : 0;
        const remaining = totalChange - achieved;

        document.getElementById('goalsCurrentWeight').textContent = current + ' kg';
        document.getElementById('goalsTargetWeight').textContent = target + ' kg';
        document.getElementById('goalsRemaining').textContent = 
            remaining > 0 ? remaining.toFixed(1) + ' kg' : '0 kg';
        
        document.getElementById('goalsProgressPercent').textContent = 
            Math.min(100, Math.round(percentage)) + '%';
        
        const progressBar = document.getElementById('goalsProgressBar');
        progressBar.style.width = Math.min(100, percentage) + '%';

        const progressText = document.getElementById('goalsProgressText');
        if (percentage >= 100) {
            progressText.textContent = '🎉 Congratulations! Goal achieved!';
        } else {
            progressText.textContent = `${remaining.toFixed(1)} kg remaining`;
        }
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    WeightTracker.init();
    MeasurementTracker.init();
    GoalTracker.init();
});