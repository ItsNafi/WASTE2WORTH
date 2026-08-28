const mysql = require('mysql2/promise');

// Standard XAMPP MySQL configuration
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'waste2worth',
    port: 3306
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

const getImpactMetrics = async (req, res) => {
    try {
        // Query 1: Total Waste Diverted (kg)
        // Aggregating sold scrap listings + verified cleanup waste
        const wasteQuery = `
            SELECT 
                (SELECT IFNULL(SUM(weight), 0) FROM ScrapListings WHERE status = 'Sold') + 
                (SELECT IFNULL(SUM(weightKg), 0) FROM WasteLogs WHERE driveId IS NOT NULL AND status IN ('Verified', 'Claimed')) 
            AS totalWasteDiverted
        `;

        // Query 2: Total Volunteer Hours Logged
        // Summing actual attended hours, falling back to the campaign's specific durationHours
        const hoursQuery = `
            SELECT IFNULL(SUM(COALESCE(ca.hoursAttended, c.durationHours)), 0) AS totalVolunteerHours 
            FROM campaign_attendance ca 
            JOIN CleanupCampaigns c ON ca.campaign_id = c.campaignId 
            WHERE c.status = 'Completed'
        `;

        // Query 3: Total Green Revenue Distributed (BDT)
        // Aggregating across all completed platform transactions
        const revenueQuery = `
            SELECT IFNULL(SUM(amount), 0) AS totalGreenRevenue 
            FROM Payments 
            WHERE status = 'Completed'
        `;

        // Execute all queries concurrently for optimization
        const [wasteResult, hoursResult, revenueResult] = await Promise.all([
            pool.query(wasteQuery),
            pool.query(hoursQuery),
            pool.query(revenueQuery)
        ]);

        const totalWasteDiverted = parseFloat(wasteResult[0][0].totalWasteDiverted) || 0;
        const totalVolunteerHours = parseFloat(hoursResult[0][0].totalVolunteerHours) || 0;
        const totalGreenRevenue = parseFloat(revenueResult[0][0].totalGreenRevenue) || 0;

        // Respond with HTTP 200 and standard CORS headers
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
            success: true,
            data: {
                totalWasteDiverted,
                totalVolunteerHours,
                totalGreenRevenue
            }
        }));
    } catch (error) {
        console.error('Impact Dashboard Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
    }
};

module.exports = {
    getImpactMetrics
};
