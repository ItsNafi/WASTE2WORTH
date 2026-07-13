const pool = require('../config/db');

const PollutionModel = {
  async create({ citizenId, locationPin, description, photoUrl }) {
    const [result] = await pool.execute(
      'INSERT INTO PollutionComplaints (citizenId, locationPin, description, photoUrl) VALUES (?, ?, ?, ?)',
      [citizenId, locationPin, description, photoUrl || null]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name as citizenName 
       FROM PollutionComplaints p 
       JOIN Users u ON p.citizenId = u.id 
       ORDER BY p.createdAt DESC`
    );
    return rows;
  },

  async findByCitizen(citizenId) {
    const [rows] = await pool.execute(
      'SELECT * FROM PollutionComplaints WHERE citizenId = ? ORDER BY createdAt DESC',
      [citizenId]
    );
    return rows;
  },

  async updateStatus(complaintId, status) {
    await pool.execute('UPDATE PollutionComplaints SET status = ? WHERE complaintId = ?', [status, complaintId]);
  }
};

module.exports = PollutionModel;
