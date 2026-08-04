const CampaignModel = require('../models/campaignModel');
const PollutionModel = require('../models/pollutionModel');
const PriceDirectoryModel = require('../models/priceDirectoryModel');
const PaymentGateway = require('../utils/paymentGateway'); // Used if admin processes mock payouts

const CAMPAIGN_STATUSES = ['Upcoming', 'Active', 'Completed'];

const validateCampaign = (body) => {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const date = String(body.date || '').trim();
  const startTime = String(body.startTime || '').trim();
  const endTime = String(body.endTime || '').trim();
  const boundaryZone = String(body.boundaryZone || '').trim();
  const organizerName = String(body.organizerName || '').trim();
  const status = String(body.status || '').trim();
  const participantCap = Number(body.participantCap);

  if (!title || !description || !date || !startTime || !endTime ||
      !boundaryZone || !organizerName || !status || !body.participantCap) {
    return { error: 'All campaign fields except the image are required' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    return { error: 'A valid campaign date is required' };
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { error: 'Valid start and end times are required' };
  }
  if (startTime >= endTime) {
    return { error: 'End time must be later than start time' };
  }
  if (!Number.isInteger(participantCap) || participantCap < 1) {
    return { error: 'Maximum volunteers must be a positive whole number' };
  }
  if (!CAMPAIGN_STATUSES.includes(status)) {
    return { error: 'Invalid campaign status' };
  }

  return {
    campaign: {
      title,
      description,
      date,
      startTime,
      endTime,
      boundaryZone,
      participantCap,
      organizerName,
      status
    }
  };
};

const AdminController = {
  async getDashboardData(req, res) {
    try {
      const campaigns = await CampaignModel.findAll();
      const complaints = await PollutionModel.findAll();
      const prices = await PriceDirectoryModel.getAllPrices();
      
      res.json({ campaigns, complaints, prices });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  },

  async createCampaign(req, res) {
    try {
      const validated = validateCampaign(req.body);
      if (validated.error) return res.status(400).json({ error: validated.error });

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const campaignId = await CampaignModel.create({ ...validated.campaign, imageUrl });
      res.status(201).json({ message: 'Campaign created successfully', campaignId });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  },

  async getCampaigns(req, res) {
    try {
      const search = String(req.query.search || '').trim();
      const status = String(req.query.status || '').trim();

      if (status && !CAMPAIGN_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid campaign status filter' });
      }

      const campaigns = await CampaignModel.findAll({ search, status });
      res.json(campaigns);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  },

  async getCampaignById(req, res) {
    try {
      const campaign = await CampaignModel.findById(req.params.campaignId);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      res.json(campaign);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  },

  async updateCampaign(req, res) {
    try {
      const existing = await CampaignModel.findById(req.params.campaignId);
      if (!existing) return res.status(404).json({ error: 'Campaign not found' });

      const validated = validateCampaign(req.body);
      if (validated.error) return res.status(400).json({ error: validated.error });
      if (validated.campaign.participantCap < existing.currentVolunteers) {
        return res.status(400).json({
          error: 'Maximum volunteers cannot be lower than the current volunteer count'
        });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.imageUrl;
      await CampaignModel.update(req.params.campaignId, { ...validated.campaign, imageUrl });
      res.json({ message: 'Campaign updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  },

  async deleteCampaign(req, res) {
    try {
      const deleted = await CampaignModel.delete(req.params.campaignId);
      if (!deleted) return res.status(404).json({ error: 'Campaign not found' });
      res.json({ message: 'Campaign deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  },

  async updatePrice(req, res) {
    try {
      const { categoryId } = req.params;
      const { pricePerKg } = req.body;
      
      if (!pricePerKg) return res.status(400).json({ error: 'Price is required' });
      
      await PriceDirectoryModel.updatePrice(categoryId, pricePerKg);
      res.json({ message: 'Price updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update price' });
    }
  },
  
  async processMockDonation(req, res) {
    try {
      const { bhangariId, campaignId, amount } = req.body;
      const result = await PaymentGateway.processBhangariToCampaignFund(bhangariId, campaignId, amount);
      res.json({ message: 'Donation processed successfully', transactionId: result.transactionId });
    } catch(err) {
      res.status(500).json({ error: 'Payment failed' });
    }
  }
};

module.exports = AdminController;
