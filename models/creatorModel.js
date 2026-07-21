const pool = require('../config/db');

const CreatorModel = {
  /** Fetch creator profile details (excluding password) */
  async getProfileById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, greenPoints, createdAt FROM Users WHERE id = ? AND role = "Creator"',
      [id]
    );
    if (!rows[0]) return null;

    // Dynamically calculate experience duration
    const createdDate = new Date(rows[0].createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let experience = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      experience = `${years} year${years !== 1 ? 's' : ''}`;
    } else if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      experience = `${months} month${months !== 1 ? 's' : ''}`;
    } else if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      experience = `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }

    rows[0].experience = experience;
    return rows[0];
  },

  /** Fetch upcycled crafts created by the creator */
  async getCraftsByCreatorId(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM UpcycledCrafts WHERE creatorId = ? ORDER BY createdAt DESC',
      [id]
    );
    return rows;
  }
};

module.exports = CreatorModel;
