const VolunteerModel = require('../models/volunteerModel');

const VolunteerController = {

  /* ── User: Register ──────────────────────────────────────────── */
  async registerVolunteer(req, res) {
    try {
      const userId = req.user.id;

      // Prevent duplicate registrations
      const existing = await VolunteerModel.findByUserId(userId);
      if (existing) {
        return res.status(409).json({ error: 'You are already registered as a volunteer.' });
      }

      const { fullName, phone, address, skills, interests, availability, experience } = req.body;

      if (!fullName || !phone || !address) {
        return res.status(400).json({ error: 'Full name, phone, and address are required.' });
      }

      const id = await VolunteerModel.create({
        userId, fullName, phone, address,
        skills, interests, availability, experience
      });

      res.status(201).json({ message: 'Volunteer registration successful!', id });
    } catch (err) {
      console.error('registerVolunteer error:', err);
      res.status(500).json({ error: 'Failed to register as volunteer.' });
    }
  },

  /* ── User: Get own profile ───────────────────────────────────── */
  async getMyProfile(req, res) {
    try {
      const profile = await VolunteerModel.findByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'No volunteer profile found.' });
      }
      res.json(profile);
    } catch (err) {
      console.error('getMyProfile error:', err);
      res.status(500).json({ error: 'Failed to fetch volunteer profile.' });
    }
  },

  /* ── User: Update own profile ────────────────────────────────── */
  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const existing = await VolunteerModel.findByUserId(userId);
      if (!existing) {
        return res.status(404).json({ error: 'No volunteer profile found to update.' });
      }

      const { fullName, phone, address, skills, interests, availability, experience } = req.body;

      if (!fullName || !phone || !address) {
        return res.status(400).json({ error: 'Full name, phone, and address are required.' });
      }

      await VolunteerModel.update(userId, {
        fullName, phone, address, skills, interests, availability, experience
      });

      res.json({ message: 'Volunteer profile updated successfully.' });
    } catch (err) {
      console.error('updateMyProfile error:', err);
      res.status(500).json({ error: 'Failed to update volunteer profile.' });
    }
  },

  /* ── User: Toggle own status ─────────────────────────────────── */
  async toggleStatus(req, res) {
    try {
      const userId = req.user.id;
      const existing = await VolunteerModel.findByUserId(userId);

      if (!existing) {
        return res.status(404).json({ error: 'No volunteer profile found.' });
      }

      const newStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
      await VolunteerModel.updateStatus(userId, newStatus);

      res.json({ message: `Volunteer status set to ${newStatus}.`, status: newStatus });
    } catch (err) {
      console.error('toggleStatus error:', err);
      res.status(500).json({ error: 'Failed to update volunteer status.' });
    }
  },

  /* ── Admin: List all volunteers ──────────────────────────────── */
  async getAllVolunteers(req, res) {
    try {
      const { status } = req.query;
      const volunteers = await VolunteerModel.findAll({ status });
      const summary    = await VolunteerModel.getSummary();
      res.json({ volunteers, summary });
    } catch (err) {
      console.error('getAllVolunteers error:', err);
      res.status(500).json({ error: 'Failed to fetch volunteers.' });
    }
  },

  /* ── Admin: Get single volunteer detail ──────────────────────── */
  async getVolunteerById(req, res) {
    try {
      const volunteer = await VolunteerModel.findById(req.params.id);
      if (!volunteer) {
        return res.status(404).json({ error: 'Volunteer not found.' });
      }
      res.json(volunteer);
    } catch (err) {
      console.error('getVolunteerById error:', err);
      res.status(500).json({ error: 'Failed to fetch volunteer details.' });
    }
  }
};

module.exports = VolunteerController;
