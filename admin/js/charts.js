// Chart Variables
let categoryChart, statusChart, trendChart;

// Initialize All Charts
function initCharts() {
    initCategoryChart();
    initStatusChart();
    initTrendChart();
}

// Category Chart (Doughnut)
function initCategoryChart() {
    const categoryCtx = document.getElementById('categoryChart');
    if (!categoryCtx) return;
    
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Complaint', 'Aspiration', 'Suggestion', 'Appreciation'],
            datasets: [{
                data: [450, 320, 280, 184],
                backgroundColor: ['#ff6b6b', '#4dabf7', '#ffa500', '#51cf66'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Status Chart (Pie)
function initStatusChart() {
    const statusCtx = document.getElementById('statusChart');
    if (!statusCtx) return;
    
    statusChart = new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Pending', 'In Progress', 'Resolved'],
            datasets: [{
                data: [56, 12, 1166],
                backgroundColor: ['#ff6b6b', '#ffa500', '#51cf66'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

// Trend Chart (Line)
function initTrendChart() {
    const trendCtx = document.getElementById('trendChart');
    if (!trendCtx) return;
    
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            datasets: [{
                label: 'Submissions',
                data: [65, 78, 90, 81, 95, 108, 120, 115, 130, 142],
                borderColor: '#0066CC',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                tension: 0.4,
                fill: true
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
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Initialize Date Filters
function initDateFilters() {
    const endDate = document.getElementById('endDate');
    const startDate = document.getElementById('startDate');
    
    if (endDate && startDate) {
        const today = new Date().toISOString().split('T')[0];
        endDate.value = today;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
    }
}

// Update Charts Based on Date Range
function updateCharts() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date');
        return;
    }
    
    // TODO: Replace with actual API call
    // Example: fetchChartData(startDate, endDate).then(data => updateChartsWithData(data));
    
    // Simulate data update based on date range
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const multiplier = Math.max(0.5, Math.min(1.5, daysDiff / 30));
    
    // Update category chart
    updateCategoryChart([
        Math.round(450 * multiplier),
        Math.round(320 * multiplier),
        Math.round(280 * multiplier),
        Math.round(184 * multiplier)
    ]);
    
    // Update status chart
    updateStatusChart([
        Math.round(56 * multiplier),
        Math.round(12 * multiplier),
        Math.round(1166 * multiplier)
    ]);
    
    // Update trend chart
    const months = Math.min(10, Math.ceil(daysDiff / 30));
    const trendData = Array.from({length: months}, (_, i) => 
        Math.round(65 + (i * 8) + (Math.random() * 10))
    );
    updateTrendChart(trendData, months);
    
    showNotification(`Charts updated for ${startDate} to ${endDate}`, 'success');
}

// Update Category Chart Data
function updateCategoryChart(data) {
    if (!categoryChart) return;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
}

// Update Status Chart Data
function updateStatusChart(data) {
    if (!statusChart) return;
    statusChart.data.datasets[0].data = data;
    statusChart.update();
}

// Update Trend Chart Data
function updateTrendChart(data, months) {
    if (!trendChart) return;
    trendChart.data.datasets[0].data = data;
    trendChart.data.labels = trendChart.data.labels.slice(0, months);
    trendChart.update();
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#51cf66' : '#ff6b6b'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Example API Integration (for backend developer)
/*
async function fetchChartData(startDate, endDate) {
    try {
        const response = await fetch(`/api/dashboard/charts?start=${startDate}&end=${endDate}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        showNotification('Failed to fetch chart data', 'error');
        return null;
    }
}

async function updateChartsWithData(data) {
    if (!data) return;
    
    // Update category chart
    if (data.categories) {
        updateCategoryChart([
            data.categories.complaint || 0,
            data.categories.aspiration || 0,
            data.categories.suggestion || 0,
            data.categories.appreciation || 0
        ]);
    }
    
    // Update status chart
    if (data.statuses) {
        updateStatusChart([
            data.statuses.pending || 0,
            data.statuses.inProgress || 0,
            data.statuses.resolved || 0
        ]);
    }
    
    // Update trend chart
    if (data.trends) {
        const trendData = data.trends.map(item => item.count);
        const labels = data.trends.map(item => item.month);
        trendChart.data.labels = labels;
        updateTrendChart(trendData, labels.length);
    }
}
*/
