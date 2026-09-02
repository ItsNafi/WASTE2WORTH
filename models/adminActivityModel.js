/**
 * models/adminActivityModel.js
 * Model for Admin-created environmental activities / campaigns for volunteers
 */
const pool = require('../config/db');

const AdminActivityModel = {
  /** Create a new activity */
  async create({ title, category, description, location, activityDate, createdBy }) {
    const [result] = await pool.execute(
      `INSERT INTO AdminActivities
         (title, category, description, location, activityDate, isActive, createdBy)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [title, category, description || null, location || null, activityDate || null, createdBy]
    );
    return result.insertId;
  },

  /** Get all activities, optionally filtered to active only, with completion counts */
  async getAll({ activeOnly = false } = {}) {
    let sql = `
      SELECT aa.*, u.name AS creatorName,
             COALESCE((SELECT COUNT(*) FROM EcoActivities ea WHERE ea.activityId = aa.id AND ea.status = 'Completed'), 0) AS completionsCount
      FROM AdminActivities aa
      JOIN Users u ON u.id = aa.createdBy
    `;
    const params = [];
    if (activeOnly) {
      sql += ' WHERE aa.isActive = 1';
    }
    sql += ' ORDER BY aa.createdAt DESC';

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /** Get single activity by ID */
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT aa.*, u.name AS creatorName,
              COALESCE((SELECT COUNT(*) FROM EcoActivities ea WHERE ea.activityId = aa.id AND ea.status = 'Completed'), 0) AS completionsCount
       FROM AdminActivities aa
       JOIN Users u ON u.id = aa.createdBy
       WHERE aa.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Toggle active / inactive status */
  async toggleActive(id, isActive) {
    const [result] = await pool.execute(
      'UPDATE AdminActivities SET isActive = ? WHERE id = ?',
      [isActive ? 1 : 0, id]
    );
    return result.affectedRows;
  },

  /** Delete activity */
  async delete(id) {
    const [result] = await pool.execute('DELETE FROM AdminActivities WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = AdminActivityModel;
