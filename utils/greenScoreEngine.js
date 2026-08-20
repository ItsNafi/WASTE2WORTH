const db = require('../config/db'); // Assuming db is a mysql2 connection pool

/**
 * Award Green Points to a user.
 * 
 * Uses a MySQL transaction to ensure points are added to the Users table
 * and an audit log is created in the green_score_logs table atomically.
 *
 * @param {number} userId - The ID of the user receiving points
 * @param {number} points - The number of points to award
 * @param {string} activityType - Description of the activity (e.g., 'CAMPAIGN_ATTENDANCE')
 * @param {number} referenceId - The ID of the related entity (e.g., campaign_id)
 * @returns {Promise<boolean>} - True if successful
 */
async function awardGreenPoints(userId, points, activityType, referenceId = null) {
    const connection = await db.getConnection();
    try {
        // Start transaction
        await connection.beginTransaction();

        // 1. Update user's greenPoints
        const [updateResult] = await connection.query(
            `UPDATE Users SET greenPoints = greenPoints + ? WHERE id = ?`,
            [points, userId]
        );

        if (updateResult.affectedRows === 0) {
            throw new Error(`User with ID ${userId} not found.`);
        }

        // 2. Insert audit log
        await connection.query(
            `INSERT INTO green_score_logs (user_id, points_earned, activity_type, reference_id)
             VALUES (?, ?, ?, ?)`,
            [userId, points, activityType, referenceId]
        );

        // Commit transaction
        await connection.commit();
        return true;
    } catch (error) {
        // Rollback on any error
        await connection.rollback();
        console.error('Error awarding green points:', error);
        throw error;
    } finally {
        // Always release the connection back to the pool
        connection.release();
    }
}

module.exports = {
    awardGreenPoints
};
