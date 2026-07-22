const express           = require('express');
const router            = express.Router();
const CreatorController = require('../controllers/creatorController');
const { verifyToken }   = require('../middleware/authMiddleware');
const { requireRole }   = require('../middleware/roleMiddleware');

// Get available raw materials
router.get('/materials', verifyToken, requireRole('Creator'), CreatorController.getRawMaterials);

// Get creator's own sales/profit history
router.get('/my/sales', verifyToken, requireRole('Creator'), CreatorController.getMySales);

// Get creator profile details and their upcycled crafts
router.get('/:id', CreatorController.getCreatorProfile);

// Add creator review & rating
router.post('/:id/reviews', verifyToken, CreatorController.addCreatorReview);

// Purchase / secure raw material
router.post('/purchase/:listingId', verifyToken, requireRole('Creator'), CreatorController.purchaseRawMaterial);

module.exports = router;
