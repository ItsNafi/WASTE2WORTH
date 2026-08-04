const CampaignModel = require('../models/campaignModel');
const RewardEngine = require('../utils/rewardEngine');
const UserModel = require('../models/userModel');

const CampaignController = {
  async getCampaigns(req, res) {
    try {
      const campaigns = await CampaignModel.findActiveAndUpcoming();
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  },

  async registerForCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const volunteerId = req.user.id;

      const campaign = await CampaignModel.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      if (!['Upcoming', 'Active'].includes(campaign.status)) {
        return res.status(400).json({ error: 'Registration is closed for this campaign' });
      }
      if (campaign.currentVolunteers >= campaign.participantCap) {
        return res.status(400).json({ error: 'This campaign has reached its volunteer limit' });
      }

      const alreadyRegistered = await CampaignModel.checkRegistration(campaignId, volunteerId);
      if (alreadyRegistered) {
        return res.status(400).json({ error: 'You are already registered for this campaign' });
      }

      await CampaignModel.registerVolunteer(campaignId, volunteerId);
      res.json({ message: 'Successfully registered for the campaign!' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to register for campaign' });
    }
  },

  async scanQRAttendance(req, res) {
    try {
      const { campaignId, volunteerId, wasteCollectedKg } = req.body;
      
      // Mock validation for QR scan endpoint
      if (!campaignId || !volunteerId) {
        return res.status(400).json({ error: 'Missing scan data' });
      }

      await CampaignModel.logAttendanceAndWaste(campaignId, volunteerId, wasteCollectedKg || 0);

      // Award points: Base 50 points for attending + points for waste collected
      let pointsAwarded = 50;
      if (wasteCollectedKg > 0) {
        pointsAwarded += RewardEngine.calculatePoints(wasteCollectedKg, 'Other'); 
      }
      
      await RewardEngine.addPointsToUser(volunteerId, pointsAwarded);

      res.json({ message: `Attendance logged successfully. Awarded ${pointsAwarded} Green Points!` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to log attendance via QR scan' });
    }
  }
};

module.exports = CampaignController;
