const pool = require('../config/db');

const CraftModel = {
  /** Insert a new upcycled craft listing. */
  async create({ creatorId, title, description, category, price, inventoryCount,
                 beforePhotoUrl, afterPhotoUrl, storyNarrative,
                 origin, materialsUsed, transformation, unitsRecycled, wasteKgDiverted,
                 creatorLabel }) {
    const [result] = await pool.execute(
      `INSERT INTO UpcycledCrafts
         (creatorId, title, description, category, price, inventoryCount,
          beforePhotoUrl, afterPhotoUrl, storyNarrative,
          origin, materialsUsed, transformation, unitsRecycled, wasteKgDiverted, creatorLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creatorId, title,
        description     || null,
        category        || null,
        price,
        inventoryCount  || 1,
        beforePhotoUrl  || null,
        afterPhotoUrl   || null,
        storyNarrative  || null,
        origin          || null,
        materialsUsed   || null,
        transformation  || null,
        unitsRecycled   || 0,
        wasteKgDiverted || 0,
        creatorLabel    || null
      ]
    );
    return {
      craftId: result.insertId,
      creatorId, title, description, category: category || null, price,
      inventoryCount, beforePhotoUrl, afterPhotoUrl, storyNarrative,
      origin, materialsUsed, transformation, unitsRecycled, wasteKgDiverted, creatorLabel
    };
  },

  /** Retrieve all crafts with creator name (newest first). */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT c.*, u.name AS creatorName
       FROM UpcycledCrafts c
       JOIN Users u ON c.creatorId = u.id
       ORDER BY c.createdAt DESC`
    );
    return rows;
  },

  /** Retrieve crafts belonging to a specific creator. */
  async findByCreator(creatorId) {
    const [rows] = await pool.execute(
      'SELECT * FROM UpcycledCrafts WHERE creatorId = ? ORDER BY createdAt DESC',
      [creatorId]
    );
    return rows;
  },

  /** Find a single craft by ID with creator name. */
  async findById(craftId) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.name AS creatorName
       FROM UpcycledCrafts c
       JOIN Users u ON c.creatorId = u.id
       WHERE c.craftId = ?`,
      [craftId]
    );
    return rows[0] || null;
  },

  /** Adjust inventory count (positive to add, negative to subtract). */
  async updateInventory(craftId, change) {
    await pool.execute(
      'UPDATE UpcycledCrafts SET inventoryCount = inventoryCount + ? WHERE craftId = ?',
      [change, craftId]
    );
  },

  /** Get all reviews for a craft. */
  async getReviews(craftId) {
    const [rows] = await pool.execute(
      'SELECT * FROM CraftReviews WHERE craftId = ? ORDER BY createdAt DESC',
      [craftId]
    );
    return rows;
  },

  /** Add a review for a craft. */
  async addReview(craftId, reviewerName, reviewText, rating) {
    const [result] = await pool.execute(
      'INSERT INTO CraftReviews (craftId, reviewerName, reviewText, rating) VALUES (?, ?, ?, ?)',
      [craftId, reviewerName, reviewText, rating || null]
    );
    return { reviewId: result.insertId, craftId, reviewerName, reviewText, rating };
  }
};

module.exports = CraftModel;
