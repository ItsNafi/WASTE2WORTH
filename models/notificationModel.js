const pool = require('../config/db');

const NotificationModel = {
  /** Create a new notification for a user */
  async create({ userId, message }) {
    const [result] = await pool.execute(
      'INSERT INTO Notifications (userId, message) VALUES (?, ?)',
      [userId, message]
    );
    return {
      id: result.insertId,
      userId,
      message,
      isRead: false
    };
  },

  /** Get all notifications for a user, ordered by most recent */
  async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM Notifications WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
    return rows;
  },

  /** Mark all unread notifications as read for a user */
  async markAllAsRead(userId) {
    await pool.execute(
      'UPDATE Notifications SET isRead = TRUE WHERE userId = ? AND isRead = FALSE',
      [userId]
    );
    return true;
  }
};

module.exports = NotificationModel;
