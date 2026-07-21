const { DriveModel, WasteLogModel, WasteRequestModel } = require('../models/wastePortalModel');
const RewardEngine = require('../utils/rewardEngine');
const UserModel    = require('../models/userModel');

const VALID_CATEGORIES = ['Plastic', 'Metal', 'Paper', 'Glass', 'E-Waste', 'Textile', 'Organic', 'Other'];

const WastePortalController = {

  

  
  async createDrive(req, res) {
    try {
      const { title, location, date, participantCap } = req.body;

      if (!title || !location || !date || !participantCap) {
        return res.status(400).json({
          error: 'title, location, date and participantCap are required'
        });
      }
      if (isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      const cap = parseInt(participantCap, 10);
      if (isNaN(cap) || cap < 1) {
        return res.status(400).json({ error: 'participantCap must be a positive integer' });
      }

      const drive = await DriveModel.create({
        title,
        location,
        date,
        participantCap: cap,
        organizerId: req.user.id
      });

      res.status(201).json({ message: 'Cleanup drive created successfully', drive });
    } catch (err) {
      console.error('createDrive error:', err);
      res.status(500).json({ error: 'Failed to create drive' });
    }
  },

  
  async getDrives(req, res) {
    try {
      const filter = req.query.filter || 'all';
      if (!['upcoming', 'past', 'all'].includes(filter)) {
        return res.status(400).json({ error: "filter must be 'upcoming', 'past', or 'all'" });
      }
      const drives = await DriveModel.findAll(filter);
      res.json(drives);
    } catch (err) {
      console.error('getDrives error:', err);
      res.status(500).json({ error: 'Failed to fetch drives' });
    }
  },

  

  
  async createWasteLog(req, res) {
    try {
      const { category, weightKg, driveId, notes } = req.body;

      if (!category || !weightKg) {
        return res.status(400).json({ error: 'category and weightKg are required' });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }
      const weight = parseFloat(weightKg);
      if (isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: 'weightKg must be a positive number' });
      }

      
      if (driveId) {
        const drive = await DriveModel.findById(driveId);
        if (!drive) {
          return res.status(404).json({ error: 'Drive not found' });
        }
      }

      const photoUrl = req.file ? '/uploads/' + req.file.filename : null;

      const log = await WasteLogModel.create({
        volunteerId: req.user.id,
        driveId:     driveId || null,
        category,
        weightKg:    weight,
        notes,
        photoUrl
      });

      
      const points = RewardEngine.calculatePoints(weight, category);
      await RewardEngine.addPointsToUser(req.user.id, points);

      res.status(201).json({
        message: `Waste log created! +${points} Green Points awarded`,
        log
      });
    } catch (err) {
      console.error('createWasteLog error:', err);
      res.status(500).json({ error: 'Failed to create waste log' });
    }
  },

  
  async getWasteLogs(req, res) {
    try {
      const { category, driveId, status, from, to, mine } = req.query;

      
      if (mine === 'true') {
        const logs = await WasteLogModel.findByVolunteer(req.user.id);
        return res.json(logs);
      }

      const filters = {};
      if (category && VALID_CATEGORIES.includes(category)) filters.category = category;
      if (driveId)  filters.driveId  = driveId;
      if (status && ['Pending', 'Verified', 'Claimed'].includes(status)) filters.status = status;
      if (from)     filters.from     = from;
      if (to)       filters.to       = to;

      const logs = await WasteLogModel.findAll(filters);
      res.json(logs);
    } catch (err) {
      console.error('getWasteLogs error:', err);
      res.status(500).json({ error: 'Failed to fetch waste logs' });
    }
  },

  

  
  async createWasteRequest(req, res) {
    try {
      const { logId, quantityKg, message } = req.body;

      if (!logId || !quantityKg) {
        return res.status(400).json({ error: 'logId and quantityKg are required' });
      }
      const qty = parseFloat(quantityKg);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'quantityKg must be a positive number' });
      }

      
      const log = await WasteLogModel.findById(logId);
      if (!log) {
        return res.status(404).json({ error: 'Waste log not found' });
      }
      if (log.status === 'Claimed') {
        return res.status(409).json({ error: 'This waste has already been claimed' });
      }
      if (qty > parseFloat(log.weightKg)) {
        return res.status(400).json({
          error: `Requested quantity (${qty} kg) exceeds available weight (${log.weightKg} kg)`
        });
      }

      
      const alreadyPending = await WasteRequestModel.hasPendingRequest(req.user.id, logId);
      if (alreadyPending) {
        return res.status(409).json({ error: 'You already have a pending request for this waste log' });
      }

      const request = await WasteRequestModel.create({
        requesterId: req.user.id,
        logId,
        quantityKg:  qty,
        message
      });

      
      await UserModel.updateGreenPoints(req.user.id, 5);

      res.status(201).json({
        message: 'Waste request submitted successfully. +5 Green Points!',
        request
      });
    } catch (err) {
      console.error('createWasteRequest error:', err);
      res.status(500).json({ error: 'Failed to submit waste request' });
    }
  },

  
  async updateWasteRequest(req, res) {
    try {
      const requestId = parseInt(req.params.id, 10);
      const { status } = req.body;

      const VALID_STATUSES = ['Approved', 'Rejected', 'Completed'];
      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      const wasteRequest = await WasteRequestModel.findById(requestId);
      if (!wasteRequest) {
        return res.status(404).json({ error: 'Waste request not found' });
      }

      const { role, id: userId } = req.user;

      
      if ((status === 'Approved' || status === 'Rejected') && wasteRequest.volunteerId !== userId && role !== 'Admin') {
        return res.status(403).json({ error: 'Only the volunteer who logged this waste can approve or reject requests' });
      }
      if (status === 'Completed' && wasteRequest.requesterId !== userId && role !== 'Admin') {
        return res.status(403).json({ error: 'Only the requester can mark a request as completed' });
      }
      if (wasteRequest.status === 'Rejected' || wasteRequest.status === 'Completed') {
        return res.status(409).json({ error: `Cannot update a request that is already ${wasteRequest.status}` });
      }

      await WasteRequestModel.updateStatus(requestId, status);

      
      if (status === 'Approved') {
        
        await WasteLogModel.updateStatus(wasteRequest.logId, 'Claimed');
        
        await UserModel.updateGreenPoints(wasteRequest.volunteerId, 5);
      }

      res.json({ message: `Request ${status.toLowerCase()} successfully` });
    } catch (err) {
      console.error('updateWasteRequest error:', err);
      res.status(500).json({ error: 'Failed to update waste request' });
    }
  },

  
  async getMyRequests(req, res) {
    try {
      const requests = await WasteRequestModel.findByRequester(req.user.id);
      res.json(requests);
    } catch (err) {
      console.error('getMyRequests error:', err);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  },

  
  async getIncomingRequests(req, res) {
    try {
      const requests = await WasteRequestModel.findByVolunteerLogs(req.user.id);
      res.json(requests);
    } catch (err) {
      console.error('getIncomingRequests error:', err);
      res.status(500).json({ error: 'Failed to fetch incoming requests' });
    }
  }
};

module.exports = WastePortalController;
