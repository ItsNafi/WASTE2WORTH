const express           = require('express');
const router            = express.Router();
const CreatorController = require('../controllers/creatorController');
const { verifyToken }   = require('../middleware/authMiddleware');
const { requireRole }   = require('../middleware/roleMiddleware');

// Get available raw materials
router.get('/materials', verifyToken, requireRole('Creator'), CreatorController.getRawMaterials);

// Purchase / secure raw material
router.post('/purchase/:listingId', verifyToken, requireRole('Creator'), CreatorController.purchaseRawMaterial);

module.exports = router;
