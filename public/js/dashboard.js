// Dashboard Configuration
const API_URL = '/api/impact-dashboard';
const POLL_INTERVAL = 10000; // 10 seconds

// Elements
const valWaste = document.getElementById('val-waste');
const valHours = document.getElementById('val-hours');
const valRevenue = document.getElementById('val-revenue');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchMetrics(); // Initial fetch
    setInterval(fetchMetrics, POLL_INTERVAL); // Background polling
});

/**
 * Fetch latest metrics from the pure Node.js backend
 */
async function fetchMetrics() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        
        if (json.success && json.data) {
            updateUI(json.data);
        }
    } catch (error) {
        console.error("Failed to fetch dashboard metrics:", error);
    }
}

/**
 * Update UI with fetched data
 */
function updateUI(data) {
    // Animate numbers for better UX
    animateValue(valWaste, parseFloat(data.totalWasteDiverted), 'kg');
    animateValue(valHours, parseFloat(data.totalVolunteerHours), 'hrs');
    animateValue(valRevenue, parseFloat(data.totalGreenRevenue), 'BDT');
}

/**
 * Utility to instantly update or animate the inner HTML
 */
function animateValue(element, newValue, unit) {
    // If it's a float with decimals, keep 2 decimal places, else integer
    const formattedValue = Number.isInteger(newValue) ? newValue : newValue.toFixed(2);
    element.innerHTML = `${formattedValue} <span class="unit">${unit}</span>`;
}

/**
 * Bilingual Support Toggle (NFR-4)
 */
function toggleLanguage(lang) {
    // Reset all elements
    document.querySelectorAll('.lang-en, .lang-bn').forEach(el => {
        el.classList.remove('active');
    });
    
    // Activate requested language
    document.querySelectorAll(`.lang-${lang}`).forEach(el => {
        el.classList.add('active');
    });
    
    // Update button states
    document.getElementById('btn-en').classList.remove('active');
    document.getElementById('btn-bn').classList.remove('active');
    document.getElementById(`btn-${lang}`).classList.add('active');
}
