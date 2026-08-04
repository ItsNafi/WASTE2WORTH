const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadCampaignImage } = require('../middleware/uploadMiddleware');

router.get('/dashboard', verifyToken, requireRole('Admin'), AdminController.getDashboardData);
router.get('/campaigns', verifyToken, requireRole('Admin'), AdminController.getCampaigns);
router.get('/campaigns/:campaignId', verifyToken, requireRole('Admin'), AdminController.getCampaignById);
router.post('/campaigns', verifyToken, requireRole('Admin'), uploadCampaignImage, AdminController.createCampaign);
router.put('/campaigns/:campaignId', verifyToken, requireRole('Admin'), uploadCampaignImage, AdminController.updateCampaign);
router.delete('/campaigns/:campaignId', verifyToken, requireRole('Admin'), AdminController.deleteCampaign);
router.put('/prices/:categoryId', verifyToken, requireRole('Admin'), AdminController.updatePrice);
router.post('/donate', verifyToken, requireRole('Admin', 'BhangariShop'), AdminController.processMockDonation);

module.exports = router;
