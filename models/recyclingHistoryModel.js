const pool = require('../config/db');

const RecyclingHistoryModel = {
  async create({ creatorId, craftId, eventDate, recycledKg, materials, description }) {
    const [result] = await pool.execute(
      `INSERT INTO RecyclingHistory
         (creatorId, craftId, eventDate, recycledKg, materials, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [creatorId, craftId || null, eventDate || new Date(), recycledKg || 0, materials || null, description || null]
    );
    return { historyId: result.insertId, creatorId, craftId, eventDate, recycledKg, materials, description };
  },

  async findByCreator(creatorId) {
    const [rows] = await pool.execute(
      `SELECT rh.*, c.title AS craftTitle
       FROM RecyclingHistory rh
       LEFT JOIN UpcycledCrafts c ON rh.craftId = c.craftId
       WHERE rh.creatorId = ?
       ORDER BY rh.eventDate DESC, rh.createdAt DESC`,
      [creatorId]
    );
    return rows;
  },

  async getSummaryByCreator(creatorId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS eventCount, IFNULL(SUM(recycledKg), 0) AS totalKg
       FROM RecyclingHistory
       WHERE creatorId = ?`,
      [creatorId]
    );
    return rows[0] || { eventCount: 0, totalKg: 0 };
  }
};

module.exports = RecyclingHistoryModel;
