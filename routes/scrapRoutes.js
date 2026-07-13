const express         = require('express');
const router          = express.Router();
const ScrapController = require('../controllers/scrapController');
const { verifyToken }    = require('../middleware/authMiddleware');
const { requireRole }    = require('../middleware/roleMiddleware');
const { uploadScrapPhoto } = require('../middleware/uploadMiddleware');

// Citizen creates a scrap listing
router.post('/', verifyToken, requireRole('Citizen'), uploadScrapPhoto, ScrapController.createListing);

// Citizen views their own listings
router.get('/my', verifyToken, requireRole('Citizen'), ScrapController.getMyListings);

// Get all listings (admin / general)
router.get('/all', verifyToken, ScrapController.getAllListings);

// Get available listings
router.get('/available', verifyToken, ScrapController.getAvailableListings);

module.exports = router;
