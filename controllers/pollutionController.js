const PollutionModel = require('../models/pollutionModel');
const RewardEngine = require('../utils/rewardEngine');

const PollutionController = {
  async submitComplaint(req, res) {
    try {
      const { locationPin, description } = req.body;
      const citizenId = req.user.id;

      if (!locationPin || !description) {
        return res.status(400).json({ error: 'Location and description are required' });
      }

      const photoUrl = req.file ? '/uploads/' + req.file.filename : null;

      await PollutionModel.create({
        citizenId, locationPin, description, photoUrl
      });

      // Award 5 points for reporting pollution
      await RewardEngine.addPointsToUser(citizenId, 5);

      res.status(201).json({ message: 'Pollution complaint submitted successfully! +5 Points' });
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
  }
};

module.exports = PollutionController;
