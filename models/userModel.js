const pool = require('../config/db');

const UserModel = {
  /** Find a user by email (returns full record including hashed password). */
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM Users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /** Find a user by ID (excludes password for safety). */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, greenPoints, createdAt FROM Users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /** Create a new user. Returns the created user object. */
  async create({ name, email, password, role }) {
    const [result] = await pool.execute(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'Citizen']
    );
    return {
      id: result.insertId,
      name,
      email,
      role: role || 'Citizen',
      greenPoints: 0
    };
  },

  /** Update a user's green points. */
  async updateGreenPoints(id, pointsToAdd) {
    const [result] = await pool.execute(
      'UPDATE Users SET greenPoints = greenPoints + ? WHERE id = ?',
      [pointsToAdd, id]
    );
    return result.affectedRows;
  },

  /** Update a user's role. */
  async updateRole(id, role) {
    const [result] = await pool.execute(
      'UPDATE Users SET role = ? WHERE id = ?',
      [role, id]
    );
    return result.affectedRows;
  }
};

module.exports = UserModel;
