/**
 * models/medalModel.js
 * Admin-awarded volunteer medals
 */
const pool = require('../config/db');

/* ── Medal catalogue (single source of truth) ── */
const MEDALS = [
  { key: 'gold_champion',    icon: '🥇', name: 'Gold Eco Champion',       points: 100 },
  { key: 'community_hero',   icon: '🏅', name: 'Community Impact Hero',    points: 75  },
  { key: 'green_leader',     icon: '⭐', name: 'Green Leadership Award',   points: 75  },
  { key: 'special_rec',      icon: '🎖️', name: 'Special Recognition Medal', points: 50  },
];

const MedalModel = {
  getCatalogue() { return MEDALS; },

  /** Award a medal to a volunteer. Returns the new row id. */
  async award({ volunteerId, adminId, medalKey, reason, pointsBonus }) {
    const def = MEDALS.find(m => m.key === medalKey);
    if (!def) throw new Error(`Unknown medalKey: ${medalKey}`);
    const bonus = (pointsBonus !== undefined && pointsBonus !== null)
      ? parseInt(pointsBonus) : def.points;

    const [result] = await pool.execute(
      `INSERT INTO VolunteerMedals
         (volunteerId, adminId, medalKey, medalName, medalIcon, reason, pointsBonus)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [volunteerId, adminId, def.key, def.name, def.icon, reason || null, bonus]
    );
    return result.insertId;
  },

  /** Get all medals for a volunteer (newest first). */
  async getByVolunteer(volunteerId) {
    const [rows] = await pool.execute(
      `SELECT vm.*, u.name AS adminName
       FROM VolunteerMedals vm
       JOIN Users u ON vm.adminId = u.id
       WHERE vm.volunteerId = ?
       ORDER BY vm.awardedAt DESC`,
      [volunteerId]
    );
    return rows;
  },

  /** Revoke (delete) a single medal by its id. */
  async revoke(medalId) {
    await pool.execute('DELETE FROM VolunteerMedals WHERE id = ?', [medalId]);
  },
};

module.exports = MedalModel;
