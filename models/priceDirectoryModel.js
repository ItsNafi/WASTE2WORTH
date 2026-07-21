const pool = require('../config/db');

const PriceDirectoryModel = {
  async getAllPrices() {
    const [rows] = await pool.execute('SELECT * FROM PriceDirectory ORDER BY categoryName ASC');
    return rows;
  },

  async getPriceByCategory(categoryName) {
    const [rows] = await pool.execute('SELECT pricePerKg FROM PriceDirectory WHERE categoryName = ?', [categoryName]);
    return rows[0] ? parseFloat(rows[0].pricePerKg) : 0.00;
  },

  async updatePrice(categoryId, pricePerKg) {
    await pool.execute('UPDATE PriceDirectory SET pricePerKg = ? WHERE categoryId = ?', [pricePerKg, categoryId]);
  }
};

module.exports = PriceDirectoryModel;
