const pool = require('../config/db');

const ReviewModel = {
  /** Create a new review for a creator */
  async create({ creatorId, customerId, rating, reviewText }) {
    const [result] = await pool.execute(
      'INSERT INTO CreatorReviews (creatorId, customerId, rating, reviewText) VALUES (?, ?, ?, ?)',
      [creatorId, customerId, rating, reviewText || null]
    );
    return {
      reviewId: result.insertId,
      creatorId,
      customerId,
      rating,
      reviewText
    };
  },

  /** Get all reviews for a specific creator with reviewer names */
  async findByCreatorId(creatorId) {
    const [rows] = await pool.execute(
      `SELECT cr.*, u.name AS customerName 
       FROM CreatorReviews cr
       JOIN Users u ON cr.customerId = u.id
       WHERE cr.creatorId = ?
       ORDER BY cr.createdAt DESC`,
      [creatorId]
    );
    return rows;
  },

  /** Get average rating for a specific creator */
  async getAverageRating(creatorId) {
    const [rows] = await pool.execute(
      'SELECT AVG(rating) as avgRating, COUNT(rating) as totalReviews FROM CreatorReviews WHERE creatorId = ?',
      [creatorId]
    );
    return {
      avgRating: parseFloat(rows[0].avgRating || 0).toFixed(1),
      totalReviews: rows[0].totalReviews || 0
    };
  }
};

module.exports = ReviewModel;
