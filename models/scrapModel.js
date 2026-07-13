const pool = require('../config/db');

const ScrapModel = {
  /** Insert a new scrap listing. */
  async create({ ownerId, category, weight, photoUrl }) {
    const [result] = await pool.execute(
      'INSERT INTO ScrapListings (ownerId, category, weight, photoUrl) VALUES (?, ?, ?, ?)',
      [ownerId, category, weight, photoUrl || null]
    );
    return {
      listingId: result.insertId,
      ownerId,
      category,
      weight,
      status: 'Available',
      photoUrl
    };
  },

  /** Retrieve all listings with owner name (newest first). */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT s.*, u.name AS ownerName
       FROM ScrapListings s
       JOIN Users u ON s.ownerId = u.id
       ORDER BY s.createdAt DESC`
    );
    return rows;
  },

  /** Retrieve only available listings with owner name. */
  async findAvailable() {
    const [rows] = await pool.execute(
      `SELECT s.*, u.name AS ownerName
       FROM ScrapListings s
       JOIN Users u ON s.ownerId = u.id
       WHERE s.status = 'Available'
       ORDER BY s.createdAt DESC`
    );
    return rows;
  },

  /** Retrieve all listings belonging to a specific owner. */
  async findByOwner(ownerId) {
    const [rows] = await pool.execute(
      'SELECT * FROM ScrapListings WHERE ownerId = ? ORDER BY createdAt DESC',
      [ownerId]
    );
    return rows;
  },

  /** Find a single listing by ID. */
  async findById(listingId) {
    const [rows] = await pool.execute(
      'SELECT * FROM ScrapListings WHERE listingId = ?',
      [listingId]
    );
    return rows[0] || null;
  },

  /** Update listing status (Available → Reserved → Sold). */
  async updateStatus(listingId, status) {
    await pool.execute(
      'UPDATE ScrapListings SET status = ? WHERE listingId = ?',
      [status, listingId]
    );
  }
};

module.exports = ScrapModel;
