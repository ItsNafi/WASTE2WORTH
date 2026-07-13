const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/campaignController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', verifyToken, CampaignController.getCampaigns);
router.post('/:campaignId/register', verifyToken, requireRole('Volunteer'), CampaignController.registerForCampaign);
router.post('/scan', verifyToken, requireRole('Volunteer', 'Admin'), CampaignController.scanQRAttendance);

module.exports = router;
