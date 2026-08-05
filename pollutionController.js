const PollutionModel = require('../models/pollutionModel');
const RewardEngine = require('../utils/rewardEngine');

const COMPLAINT_STATUSES = ['Pending', 'Reviewed', 'Resolved'];

const parseComplaintId = (value) => {
  const complaintId = Number(value);
  return Number.isInteger(complaintId) && complaintId > 0 ? complaintId : null;
};

const PollutionController = {
  async submitComplaint(req, res) {
    try {
      const locationPin = String(req.body.locationPin || '').trim();
      const description = String(req.body.description || '').trim();
      const citizenId = req.user.id;

      if (!locationPin || !description) {
        return res.status(400).json({ error: 'Location and description are required' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'A pollution photo is required' });
      }

      const photoUrl = '/uploads/' + req.file.filename;

      const complaintId = await PollutionModel.create({
        citizenId, locationPin, description, photoUrl
      });

      // Award 5 points for reporting pollution
      await RewardEngine.addPointsToUser(citizenId, 5);

      res.status(201).json({
        message: 'Pollution complaint submitted successfully! +5 Points',
        complaintId
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit complaint' });
    }
  },

  async getMyComplaints(req, res) {
    try {
      const complaints = await PollutionModel.findByCitizen(req.user.id);
      res.json(complaints);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  },

  async getAllComplaints(req, res) {
    try {
      const complaints = await PollutionModel.findAll();
      res.json(complaints);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  },

  async updateComplaintStatus(req, res) {
    try {
      const complaintId = parseComplaintId(req.params.complaintId);
      const status = String(req.body.status || '').trim();

      if (!complaintId) {
        return res.status(400).json({ error: 'Invalid complaint ID' });
      }
      if (!COMPLAINT_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${COMPLAINT_STATUSES.join(', ')}`
        });
      }

      const updated = await PollutionModel.updateStatus(complaintId, status);
      if (!updated) return res.status(404).json({ error: 'Complaint not found' });

      res.json({ message: 'Complaint status updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update complaint status' });
    }
  },

  async deleteComplaint(req, res) {
    try {
      const complaintId = parseComplaintId(req.params.complaintId);
      if (!complaintId) {
        return res.status(400).json({ error: 'Invalid complaint ID' });
      }

      const deleted = await PollutionModel.delete(complaintId);
      if (!deleted) return res.status(404).json({ error: 'Complaint not found' });

      res.json({ message: 'Complaint deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete complaint' });
    }
  }
};

module.exports = PollutionController;
