// ========================================
// NUTRITION.JS - Nutrition Tracking
// ========================================

const NutritionTracker = {
    init: function() {
        this.attachEventListeners();
        this.refresh();
    },

    attachEventListeners: function() {
        const targetsForm = document.getElementById('targetsForm');
        if (targetsForm) {
            targetsForm.addEventListener('submit', (e) => this.handleSaveTargets(e));
        }

        const nutritionForm = document.getElementById('nutritionForm');
        if (nutritionForm) {
            nutritionForm.addEventListener('submit', (e) => this.handleAddNutrition(e));
        }
    },

    refresh: function() {
        this.loadTargets();
        this.updateTodayProgress();
        this.renderNutritionHistory();
    },

    handleSaveTargets: function(e) {
        e.preventDefault();

        const targets = {
            calories: parseInt(document.getElementById('calorieTarget').value),
            protein: parseInt(document.getElementById('proteinTarget').value),
            carbs: parseInt(document.getElementById('carbTarget').value),
            fat: parseInt(document.getElementById('fatTarget').value),
            water: parseFloat(document.getElementById('waterTarget').value)
        };

        // Validation
        if (!targets.calories || !targets.protein || !targets.carbs || !targets.fat || !targets.water) {
            showFormMessage('targetsMessage', 'Please fill all fields', 'error');
            return;
        }

        if (targets.calories <= 0 || targets.protein <= 0 || targets.carbs <= 0 || 
            targets.fat <= 0 || targets.water <= 0) {
            showFormMessage('targetsMessage', 'All values must be greater than 0', 'error');
            return;
        }

        StorageManager.save('nutritionTargets', targets);
        showFormMessage('targetsMessage', 'Targets saved successfully!', 'success');
        
        this.refresh();
        DashboardManager.refresh();
    },

    loadTargets: function() {
        const targets = StorageManager.load('nutritionTargets', {
            calories: 2000,
            protein: 160,
            carbs: 250,
            fat: 70,
            water: 3.5
        });

        document.getElementById('calorieTarget').value = targets.calories || 2000;
        document.getElementById('proteinTarget').value = targets.protein || 160;
        document.getElementById('carbTarget').value = targets.carbs || 250;
        document.getElementById('fatTarget').value = targets.fat || 70;
        document.getElementById('waterTarget').value = targets.water || 3.5;
    },

    handleAddNutrition: function(e) {
        e.preventDefault();

        const date = document.getElementById('nutritionDate').value;
        const calories = parseInt(document.getElementById('nutritionCalories').value);
        const protein = parseInt(document.getElementById('nutritionProtein').value);
        const carbs = parseInt(document.getElementById('nutritionCarbs').value);
        const fat = parseInt(document.getElementById('nutritionFat').value);
        const water = parseFloat(document.getElementById('nutritionWater').value);

        // Validation
        if (!date || !calories || !protein || !carbs || !fat || !water) {
            showFormMessage('nutritionFormMessage', 'Please fill all fields', 'error');
            return;
        }

        if (calories <= 0 || protein <= 0 || carbs <= 0 || fat <= 0 || water <= 0) {
            showFormMessage('nutritionFormMessage', 'All values must be greater than 0', 'error');
            return;
        }

        const entry = {
            id: Date.now(),
            date,
            calories,
            protein,
            carbs,
            fat,
            water
        };

        let history = StorageManager.load('nutritionHistory', []);
        
        // Check if entry exists for this date
        const existingIndex = history.findIndex(h => h.date === date);
        if (existingIndex !== -1) {
            history[existingIndex] = entry;
            showFormMessage('nutritionFormMessage', 'Entry updated', 'success');
        } else {
            history.push(entry);
            showFormMessage('nutritionFormMessage', 'Entry added', 'success');
        }

        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        StorageManager.save('nutritionHistory', history);

        // Update today's nutrition
        if (date === getTodayDate()) {
            StorageManager.save('todayNutrition', {
                calories,
                protein,
                carbs,
                fat,
                water
            });
        }

        this.refresh();
        document.getElementById('nutritionForm').reset();
        setDefaultDates();
        DashboardManager.refresh();
    },

    updateTodayProgress: function() {
        const targets = StorageManager.load('nutritionTargets', {});
        const nutrition = StorageManager.load('todayNutrition', {});

        const updateProgress = (elementId, current, target) => {
            const percentage = target > 0 ? (current / target) * 100 : 0;
            const element = document.getElementById(elementId);
            if (element) {
                element.style.width = Math.min(100, percentage) + '%';
            }
        };

        const updateValue = (elementId, current, target) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = `${current} / ${target}`;
            }
        };

        // Calories
        const calories = nutrition.calories || 0;
        const calorieTarget = targets.calories || 2000;
        updateProgress('calorieProgress', calories, calorieTarget);
        updateValue('calorieValue', calories, calorieTarget + ' kcal');

        // Protein
        const protein = nutrition.protein || 0;
        const proteinTarget = targets.protein || 160;
        updateProgress('proteinProgress', protein, proteinTarget);
        updateValue('proteinValue', protein + ' g', proteinTarget + ' g');

        // Carbs
        const carbs = nutrition.carbs || 0;
        const carbTarget = targets.carbs || 250;
        updateProgress('carbProgress', carbs, carbTarget);
        updateValue('carbValue', carbs + ' g', carbTarget + ' g');

        // Fat
        const fat = nutrition.fat || 0;
        const fatTarget = targets.fat || 70;
        updateProgress('fatProgress', fat, fatTarget);
        updateValue('fatValue', fat + ' g', fatTarget + ' g');

        // Water
        const water = nutrition.water || 0;
        const waterTarget = targets.water || 3.5;
        updateProgress('waterProgress', water, waterTarget);
        updateValue('waterValue', water.toFixed(1) + ' L', waterTarget + ' L');
    },

    renderNutritionHistory: function() {
        const history = StorageManager.load('nutritionHistory', []);
        const tbody = document.getElementById('nutritionTableBody');

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No nutrition entries yet</td></tr>';
            return;
        }

        tbody.innerHTML = history.map(entry => `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.calories} kcal</td>
                <td>${entry.protein} g</td>
                <td>${entry.carbs} g</td>
                <td>${entry.fat} g</td>
                <td>${entry.water} L</td>
                <td>
                    <button class="btn-danger" onclick="NutritionTracker.deleteNutrition(${entry.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    deleteNutrition: function(id) {
        if (confirm('Delete this nutrition entry?')) {
            let history = StorageManager.load('nutritionHistory', []);
            history = history.filter(h => h.id !== id);
            StorageManager.save('nutritionHistory', history);
            this.refresh();
            DashboardManager.refresh();
            showFormMessage('nutritionFormMessage', 'Entry deleted', 'success');
        }
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    NutritionTracker.init();
});