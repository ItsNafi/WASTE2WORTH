const pool = require('../config/db');

const PriceDirectoryModel = {
  async getAllPrices() {
    const [rows] = await pool.execute('SELECT * FROM PriceDirectory ORDER BY categoryName ASC');
    return rows;
  },

  async updatePrice(categoryId, pricePerKg) {
    await pool.execute('UPDATE PriceDirectory SET pricePerKg = ? WHERE categoryId = ?', [pricePerKg, categoryId]);
  }
};

module.exports = PriceDirectoryModel;
