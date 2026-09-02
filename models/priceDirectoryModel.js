const pool = require('../config/db');

const PriceDirectoryModel = {
  /** Fetch all ACTIVE materials — used by public/user views */
  async getActiveAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM PriceDirectory WHERE isActive = 1 ORDER BY displayCategory ASC, categoryName ASC'
    );
    return rows;
  },

  /** Fetch ALL materials (active + inactive) — admin only */
  async getAllAdmin() {
    const [rows] = await pool.execute(
      'SELECT * FROM PriceDirectory ORDER BY displayCategory ASC, categoryName ASC'
    );
    return rows;
  },

  /** Legacy: used by scrapController / adminController */
  async getAllPrices() {
    return this.getActiveAll();
  },

  /** Fetch price for a single category by name */
  async getPriceByCategory(categoryName) {
    const [rows] = await pool.execute(
      'SELECT pricePerKg FROM PriceDirectory WHERE categoryName = ? AND isActive = 1',
      [categoryName]
    );
    return rows[0] ? parseFloat(rows[0].pricePerKg) : 0.00;
  },

  /** Fetch single material by ID */
  async getById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM PriceDirectory WHERE categoryId = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Admin: add a new material */
  async addMaterial({ categoryName, displayCategory, pricePerKg, description, icon, isActive }) {
    const [result] = await pool.execute(
      `INSERT INTO PriceDirectory
         (categoryName, displayCategory, pricePerKg, description, icon, isActive)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        categoryName,
        displayCategory || 'Other',
        pricePerKg,
        description || null,
        icon || '♻️',
        isActive !== undefined ? isActive : 1
      ]
    );
    return result.insertId;
  },

  /** Admin: update an existing material's details */
  async updateMaterial(id, { pricePerKg, description, icon, displayCategory, categoryName }) {
    await pool.execute(
      `UPDATE PriceDirectory
       SET pricePerKg      = COALESCE(?, pricePerKg),
           description     = COALESCE(?, description),
           icon            = COALESCE(?, icon),
           displayCategory = COALESCE(?, displayCategory),
           categoryName    = COALESCE(?, categoryName)
       WHERE categoryId = ?`,
      [
        pricePerKg   !== undefined ? pricePerKg   : null,
        description  !== undefined ? description  : null,
        icon         !== undefined ? icon         : null,
        displayCategory !== undefined ? displayCategory : null,
        categoryName !== undefined ? categoryName : null,
        id
      ]
    );
  },

  /** Legacy: used by adminController — kept for backwards compat */
  async updatePrice(categoryId, pricePerKg) {
    await pool.execute(
      'UPDATE PriceDirectory SET pricePerKg = ? WHERE categoryId = ?',
      [pricePerKg, categoryId]
    );
  },

  /** Admin: toggle a material active / inactive */
  async toggleActive(id, isActive) {
    await pool.execute(
      'UPDATE PriceDirectory SET isActive = ? WHERE categoryId = ?',
      [isActive ? 1 : 0, id]
    );
  }
};

module.exports = PriceDirectoryModel;
