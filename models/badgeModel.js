/**
 * models/badgeModel.js
 * Feature 14 — Milestone Achievement Badges
 * Data access layer for EcoActivities and EcoBadges tables.
 */
const pool = require('../config/db');

/* ── Badge Definitions (single source of truth) ─────────────── */
const BADGES = [
  {
    key:         'eco_starter',
    emoji:       '🌱',
    name:        'Eco Starter',
    description: 'Started participating in environmental activities.',
    requirement: 1,
    requirementLabel: 'Complete 1 activity',
  },
  {
    key:         'eco_contributor',
    emoji:       '♻️',
    name:        'Eco Contributor',
    description: 'Consistently participated in environmental activities.',
    requirement: 5,
    requirementLabel: 'Complete 5 activities',
  },
  {
    key:         'eco_champion',
    emoji:       '🌍',
    name:        'Eco Champion',
    description: 'Reached a major participation milestone.',
    requirement: 10,
    requirementLabel: 'Complete 10 activities',
  },
];

const BadgeModel = {

  /** Return the static badge definitions. */
  getBadgeDefinitions() {
    return BADGES;
  },

  /**
   * Log a completed eco-activity for a user.
   * @returns {number} insertId
   */
  async logActivity(userId, activityId, activityType, description, activityDate) {
    const [result] = await pool.execute(
      `INSERT INTO EcoActivities (userId, activityId, activityType, description, activityDate, status)
       VALUES (?, ?, ?, ?, ?, 'Completed')`,
      [userId, activityId || null, activityType, description || null, activityDate]
    );
    return result.insertId;
  },

  /**
   * Get all activities for a user, most recent first.
   */
  async getActivities(userId) {
    const [rows] = await pool.execute(
      `SELECT ea.id, ea.activityId, ea.activityType, ea.description, ea.activityDate, ea.status, ea.createdAt,
              aa.title AS activityTitle, aa.location AS activityLocation
       FROM EcoActivities ea
       LEFT JOIN AdminActivities aa ON aa.id = ea.activityId
       WHERE ea.userId = ?
       ORDER BY ea.activityDate DESC, ea.createdAt DESC`,
      [userId]
    );
    return rows;
  },

  /**
   * Count completed activities for a user.
   */
  async getActivityCount(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM EcoActivities
       WHERE userId = ? AND status = 'Completed'`,
      [userId]
    );
    return Number(rows[0].total);
  },

  /**
   * Get all badges earned by a user (keyed by badgeKey).
   * @returns {Object}  e.g. { eco_starter: { earnedAt: Date }, ... }
   */
  async getEarnedBadges(userId) {
    const [rows] = await pool.execute(
      `SELECT badgeKey, earnedAt FROM EcoBadges WHERE userId = ?`,
      [userId]
    );
    const map = {};
    for (const row of rows) map[row.badgeKey] = row;
    return map;
  },

  /**
   * Award a badge to a user.
   * Uses INSERT IGNORE so it never overwrites an existing earned date.
   */
  async awardBadge(userId, badgeKey) {
    await pool.execute(
      `INSERT IGNORE INTO EcoBadges (userId, badgeKey) VALUES (?, ?)`,
      [userId, badgeKey]
    );
  },

  /**
   * Check all milestones against the user's completed count.
   * Awards any newly unlocked badges and returns them.
   * @returns {Array} newly awarded badge definitions
   */
  async checkAndAwardBadges(userId) {
    const count        = await this.getActivityCount(userId);
    const alreadyOwned = await this.getEarnedBadges(userId);
    const newlyEarned  = [];

    for (const badge of BADGES) {
      if (count >= badge.requirement && !alreadyOwned[badge.key]) {
        await this.awardBadge(userId, badge.key);
        newlyEarned.push(badge);
      }
    }
    return newlyEarned;
  },

  /**
   * Build the full badge status payload for the achievements page.
   * Merges static definitions with earned state for the user.
   */
  async getBadgeStatus(userId) {
    const count   = await this.getActivityCount(userId);
    const earned  = await this.getEarnedBadges(userId);

    const badges = BADGES.map(b => ({
      ...b,
      earned:   !!earned[b.key],
      earnedAt: earned[b.key] ? earned[b.key].earnedAt : null,
      progress: Math.min(count, b.requirement),
    }));

    return { count, badges };
  },

  /**
   * Admin overview of all volunteers with their activities count, earned badges, and medals.
   */
  async getAdminVolunteerOverview() {
    const [volunteers] = await pool.execute(`
      SELECT vp.id AS profileId, vp.userId, COALESCE(vp.fullName, u.name) AS fullName, u.name AS userName, u.email AS userEmail, vp.phone, COALESCE(vp.status, 'Active') AS volunteerStatus,
             COALESCE((SELECT COUNT(*) FROM EcoActivities ea WHERE ea.userId = vp.userId AND ea.status = 'Completed'), 0) AS completedActivitiesCount,
             COALESCE((SELECT COUNT(*) FROM EcoBadges eb WHERE eb.userId = vp.userId), 0) AS badgesCount,
             COALESCE((SELECT COUNT(*) FROM VolunteerMedals vm WHERE vm.volunteerId = vp.userId), 0) AS medalsCount
      FROM VolunteerProfiles vp
      JOIN Users u ON u.id = vp.userId
      ORDER BY completedActivitiesCount DESC, vp.createdAt DESC
    `);

    const [allBadges] = await pool.execute(`
      SELECT eb.userId, eb.badgeKey, eb.earnedAt
      FROM EcoBadges eb
    `);

    const [allMedals] = await pool.execute(`
      SELECT vm.id, vm.volunteerId, vm.medalKey, vm.medalName, vm.medalIcon, vm.reason, vm.pointsBonus, vm.awardedAt,
             u.name AS adminName
      FROM VolunteerMedals vm
      LEFT JOIN Users u ON vm.adminId = u.id
      ORDER BY vm.awardedAt DESC
    `);

    const badgeMap = {};
    for (const b of allBadges) {
      if (!badgeMap[b.userId]) badgeMap[b.userId] = [];
      const def = BADGES.find(x => x.key === b.badgeKey);
      badgeMap[b.userId].push({
        badgeKey: b.badgeKey,
        badgeName: def ? def.name : b.badgeKey,
        emoji: def ? def.emoji : '🏅',
        earnedAt: b.earnedAt
      });
    }

    const medalMap = {};
    for (const m of allMedals) {
      if (!medalMap[m.volunteerId]) medalMap[m.volunteerId] = [];
      medalMap[m.volunteerId].push(m);
    }

    return volunteers.map(v => ({
      ...v,
      badges: badgeMap[v.userId] || [],
      medals: medalMap[v.userId] || []
    }));
  }
};

module.exports = BadgeModel;
