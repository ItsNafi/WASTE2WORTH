const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/dashboard', verifyToken, requireRole('Admin'), AdminController.getDashboardData);
router.post('/campaigns', verifyToken, requireRole('Admin'), AdminController.createCampaign);
router.put('/prices/:categoryId', verifyToken, requireRole('Admin'), AdminController.updatePrice);
router.post('/donate', verifyToken, requireRole('Admin', 'BhangariShop'), AdminController.processMockDonation);

module.exports = router;
