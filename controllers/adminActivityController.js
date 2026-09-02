/**
 * controllers/adminActivityController.js
 * Controller for Admin-created activities
 */
const AdminActivityModel = require('../models/adminActivityModel');

const AdminActivityController = {
  /**
   * GET /api/admin-activities
   * Returns activities list (all for admin, active-only for volunteers/public)
   */
  async getAllActivities(req, res) {
    try {
      const isAdmin = req.user && req.user.role === 'Admin';
      const activeOnly = !isAdmin || req.query.activeOnly === 'true';
      const activities = await AdminActivityModel.getAll({ activeOnly });
      return res.json(activities);
    } catch (err) {
      console.error('[AdminActivityController.getAllActivities]', err);
      return res.status(500).json({ error: 'Failed to fetch activities.' });
    }
  },

  /**
   * POST /api/admin-activities
   * Admin only — create a new activity
   */
  async createActivity(req, res) {
    try {
      const { title, category, description, location, activityDate } = req.body;

      if (!title || !category) {
        return res.status(400).json({ error: 'Title and Category are required.' });
      }

      const VALID_CATEGORIES = [
        'Recycling',
        'Waste Collection',
        'Tree Planting',
        'Reuse/Upcycling',
        'Other Environmental Activity'
      ];

      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid activity category.' });
      }

      const insertId = await AdminActivityModel.create({
        title: title.trim(),
        category,
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
        activityDate: activityDate || null,
        createdBy: req.user.id
      });

      const newActivity = await AdminActivityModel.getById(insertId);
      return res.status(201).json({
        message: 'Environmental activity created successfully!',
        activity: newActivity
      });
    } catch (err) {
      console.error('[AdminActivityController.createActivity]', err);
      return res.status(500).json({ error: 'Failed to create activity.' });
    }
  },

  /**
   * PATCH /api/admin-activities/:id/toggle
   * Admin only — toggle active status
   */
  async toggleActivity(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: 'isActive field is required.' });
      }

      const existing = await AdminActivityModel.getById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Activity not found.' });
      }

      await AdminActivityModel.toggleActive(id, isActive);
      return res.json({
        message: `Activity ${isActive ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (err) {
      console.error('[AdminActivityController.toggleActivity]', err);
      return res.status(500).json({ error: 'Failed to toggle activity.' });
    }
  },

  /**
   * DELETE /api/admin-activities/:id
   * Admin only — delete activity
   */
  async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const existing = await AdminActivityModel.getById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Activity not found.' });
      }

      await AdminActivityModel.delete(id);
      return res.json({ message: 'Activity deleted successfully.' });
    } catch (err) {
      console.error('[AdminActivityController.deleteActivity]', err);
      return res.status(500).json({ error: 'Failed to delete activity.' });
    }
  }
};

module.exports = AdminActivityController;
