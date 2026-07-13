const express = require('express');
const router = express.Router();
const RewardController = require('../controllers/rewardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/certificate', verifyToken, RewardController.downloadCertificate);

module.exports = router;
