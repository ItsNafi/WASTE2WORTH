/**
 * controllers/medalController.js
 * Admin-awarded volunteer achievement medals
 */
const MedalModel = require('../models/medalModel');
const UserModel  = require('../models/userModel');

const MedalController = {

  /** GET /api/medals/catalogue — list available medal types */
  getCatalogue(_req, res) {
    res.json(MedalModel.getCatalogue());
  },

  /**
   * POST /api/medals/award/:volunteerId
   * Body: { medalKey, reason?, pointsBonus? }
   * Admin only.
   */
  async award(req, res) {
    try {
      const volunteerId = parseInt(req.params.volunteerId, 10);
      const adminId     = req.user.id;
      const { medalKey, reason, pointsBonus } = req.body;

      if (!medalKey) return res.status(400).json({ error: 'medalKey is required' });

      // Verify volunteer exists
      const volunteer = await UserModel.findById(volunteerId);
      if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

      const id    = await MedalModel.award({ volunteerId, adminId, medalKey, reason, pointsBonus });
      const bonus = parseInt(pointsBonus) || MedalModel.getCatalogue().find(m => m.key === medalKey)?.points || 50;

      // Credit green points to the volunteer
      await UserModel.updateGreenPoints(volunteerId, bonus);

      return res.status(201).json({ message: 'Medal awarded successfully', medalId: id, pointsAwarded: bonus });
    } catch (err) {
      console.error('[MedalController.award]', err);
      return res.status(500).json({ error: err.message || 'Failed to award medal' });
    }
  },

  /** GET /api/medals/volunteer/:volunteerId — fetch all medals for a volunteer */
  async getForVolunteer(req, res) {
    try {
      const medals = await MedalModel.getByVolunteer(req.params.volunteerId);
      res.json(medals);
    } catch (err) {
      console.error('[MedalController.getForVolunteer]', err);
      res.status(500).json({ error: 'Failed to fetch medals' });
    }
  },

  /** DELETE /api/medals/:medalId — revoke a medal (Admin only) */
  async revoke(req, res) {
    try {
      await MedalModel.revoke(req.params.medalId);
      res.json({ message: 'Medal revoked' });
    } catch (err) {
      console.error('[MedalController.revoke]', err);
      res.status(500).json({ error: 'Failed to revoke medal' });
    }
  },

  /** GET /api/medals/my — medals for the currently logged-in user */
  async getMy(req, res) {
    try {
      const medals = await MedalModel.getByVolunteer(req.user.id);
      res.json(medals);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch your medals' });
    }
  },
};

module.exports = MedalController;
