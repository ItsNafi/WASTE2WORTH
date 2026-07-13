const express = require('express');
const router = express.Router();
const PollutionController = require('../controllers/pollutionController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadScrapPhoto } = require('../middleware/uploadMiddleware'); // Reuse single photo upload

router.post('/', verifyToken, requireRole('Citizen'), uploadScrapPhoto, PollutionController.submitComplaint);
router.get('/my', verifyToken, requireRole('Citizen'), PollutionController.getMyComplaints);

module.exports = router;
