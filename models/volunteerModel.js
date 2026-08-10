const pool = require('../config/db');

const VolunteerModel = {

  /** Create a new volunteer profile. */
  async create({ userId, fullName, phone, address, skills, interests, availability, experience }) {
    const [result] = await pool.execute(
      `INSERT INTO VolunteerProfiles
         (userId, fullName, phone, address, skills, interests, availability, experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fullName, phone, address,
       skills || null, interests || null,
       availability || 'Flexible', experience || null]
    );
    return result.insertId;
  },

  /** Get a volunteer profile by the owning user's ID. */
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT vp.*, u.name AS userName, u.email AS userEmail
       FROM VolunteerProfiles vp
       JOIN Users u ON u.id = vp.userId
       WHERE vp.userId = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  /** Get a volunteer profile by its own PK (for admin detail view). */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT vp.*, u.name AS userName, u.email AS userEmail
       FROM VolunteerProfiles vp
       JOIN Users u ON u.id = vp.userId
       WHERE vp.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /** Update profile fields for the given userId. */
  async update(userId, { fullName, phone, address, skills, interests, availability, experience }) {
    const [result] = await pool.execute(
      `UPDATE VolunteerProfiles
       SET fullName = ?, phone = ?, address = ?,
           skills = ?, interests = ?, availability = ?, experience = ?
       WHERE userId = ?`,
      [fullName, phone, address,
       skills || null, interests || null,
       availability || 'Flexible', experience || null,
       userId]
    );
    return result.affectedRows;
  },

  /** Toggle Active / Inactive status for a given userId. */
  async updateStatus(userId, status) {
    const [result] = await pool.execute(
      'UPDATE VolunteerProfiles SET status = ? WHERE userId = ?',
      [status, userId]
    );
    return result.affectedRows;
  },

  /**
   * Get all volunteer profiles (admin).
   * @param {object} options  Optional filters: { status: 'Active'|'Inactive' }
   */
  async findAll({ status } = {}) {
    let sql = `
      SELECT vp.*, u.name AS userName, u.email AS userEmail
      FROM VolunteerProfiles vp
      JOIN Users u ON u.id = vp.userId`;
    const params = [];

    if (status && ['Active', 'Inactive'].includes(status)) {
      sql += ' WHERE vp.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vp.createdAt DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /** Count totals for the admin summary cards. */
  async getSummary() {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'Active')   AS active,
         SUM(status = 'Inactive') AS inactive
       FROM VolunteerProfiles`
    );
    return rows[0];
  }
};

module.exports = VolunteerModel;
