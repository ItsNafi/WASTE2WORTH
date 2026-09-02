/**
 * controllers/badgeController.js
 * Feature 14 — Milestone Achievement Badges
 */
const BadgeModel = require('../models/badgeModel');
const AdminActivityModel = require('../models/adminActivityModel');

const BadgeController = {

  /**
   * POST /api/badges/activities
   * Log a new completed eco-activity and check badge milestones.
   */
  async logActivity(req, res) {
    try {
      const userId = req.user.id;
      let { activityId, activityType, description, activityDate } = req.body;

      /* ── Validate & Resolve Admin Activity ──────────────── */
      if (activityId) {
        const adminAct = await AdminActivityModel.getById(activityId);
        if (!adminAct || !adminAct.isActive) {
          return res.status(400).json({ error: 'Selected environmental activity is inactive or does not exist.' });
        }
        activityType = adminAct.category;
        if (!description || description.trim() === '') {
          description = adminAct.title + (adminAct.location ? ` - ${adminAct.location}` : '');
        }
      }

      const VALID_TYPES = [
        'Recycling',
        'Waste Collection',
        'Tree Planting',
        'Reuse/Upcycling',
        'Other Environmental Activity',
      ];

      if (!activityType || !VALID_TYPES.includes(activityType)) {
        return res.status(400).json({ error: 'Please select a valid environmental activity.' });
      }
      if (!activityDate) {
        return res.status(400).json({ error: 'Activity date is required.' });
      }

      /* ── Persist ───────────────────────────────────────── */
      const insertId = await BadgeModel.logActivity(
        userId, activityId || null, activityType, description, activityDate
      );

      /* ── Auto-award badges ─────────────────────────────── */
      const newlyEarned = await BadgeModel.checkAndAwardBadges(userId);
      const count       = await BadgeModel.getActivityCount(userId);

      return res.status(201).json({
        message:     'Activity completed and logged successfully! 🌿',
        activityId:  insertId,
        totalCount:  count,
        newlyEarned,           // array of badge objects
      });
    } catch (err) {
      console.error('[BadgeController.logActivity]', err);
      return res.status(500).json({ error: 'Failed to log activity.' });
    }
  },

  /**
   * GET /api/badges/activities
   * Return activity history + completed count for the current user.
   */
  async getActivities(req, res) {
    try {
      const userId    = req.user.id;
      const activities = await BadgeModel.getActivities(userId);
      const count      = await BadgeModel.getActivityCount(userId);

      return res.json({ activities, count });
    } catch (err) {
      console.error('[BadgeController.getActivities]', err);
      return res.status(500).json({ error: 'Failed to fetch activities.' });
    }
  },

  /**
   * GET /api/badges/my-badges
   * Return full badge status (earned + progress) for the current user.
   */
  async getMyBadges(req, res) {
    try {
      const userId = req.user.id;
      const status  = await BadgeModel.getBadgeStatus(userId);
      return res.json(status);
    } catch (err) {
      console.error('[BadgeController.getMyBadges]', err);
      return res.status(500).json({ error: 'Failed to fetch badges.' });
    }
  },

  /**
   * GET /api/badges/admin/overview
   * Admin only — view all volunteers with activities, badges, and medals metrics.
   */
  async getAdminVolunteerOverview(req, res) {
    try {
      const overview = await BadgeModel.getAdminVolunteerOverview();
      return res.json(overview);
    } catch (err) {
      console.error('[BadgeController.getAdminVolunteerOverview]', err);
      return res.status(500).json({ error: 'Failed to fetch volunteer achievements overview.' });
    }
  },

  /**
   * POST /api/badges/award/:volunteerId
   * Admin only — award a badge to a volunteer.
   */
  async awardBadgeToVolunteer(req, res) {
    try {
      const { volunteerId } = req.params;
      const { badgeKey } = req.body;

      if (!badgeKey) {
        return res.status(400).json({ error: 'badgeKey is required.' });
      }

      const defs = BadgeModel.getBadgeDefinitions();
      const def = defs.find(b => b.key === badgeKey);
      if (!def) {
        return res.status(400).json({ error: 'Invalid badgeKey.' });
      }

      await BadgeModel.awardBadge(volunteerId, badgeKey);
      return res.json({ message: `Awarded ${def.emoji} ${def.name} badge successfully!`, badge: def });
    } catch (err) {
      console.error('[BadgeController.awardBadgeToVolunteer]', err);
      return res.status(500).json({ error: 'Failed to award badge.' });
    }
  },

  /**
   * GET /api/badges/volunteer/:volunteerId
   * Admin only — get activities and badge status for a specific volunteer.
   */
  async getVolunteerActivitiesForAdmin(req, res) {
    try {
      const { volunteerId } = req.params;
      const activities = await BadgeModel.getActivities(volunteerId);
      const count = await BadgeModel.getActivityCount(volunteerId);
      const badgeStatus = await BadgeModel.getBadgeStatus(volunteerId);

      return res.json({ activities, count, badgeStatus });
    } catch (err) {
      console.error('[BadgeController.getVolunteerActivitiesForAdmin]', err);
      return res.status(500).json({ error: 'Failed to fetch volunteer details.' });
    }
  },
};

module.exports = BadgeController;
