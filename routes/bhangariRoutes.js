const express            = require('express');
const router             = express.Router();
const BhangariController = require('../controllers/bhangariController');
const { verifyToken }    = require('../middleware/authMiddleware');
const { requireRole }    = require('../middleware/roleMiddleware');

// Get all scrap listings (board view)
router.get('/board', verifyToken, requireRole('BhangariShop'), BhangariController.getBoard);

// Purchase a scrap listing
router.post('/purchase/:listingId', verifyToken, requireRole('BhangariShop'), BhangariController.purchaseScrap);

module.exports = router;
