const express         = require('express');
const router          = express.Router();
const CraftController = require('../controllers/craftController');
const { verifyToken }      = require('../middleware/authMiddleware');
const { requireRole }      = require('../middleware/roleMiddleware');
const { uploadCraftPhotos } = require('../middleware/uploadMiddleware');

// Public storefront — all crafts
router.get('/', CraftController.getAllCrafts);

// Creator views own crafts
router.get('/my/list', verifyToken, requireRole('Creator'), CraftController.getMyCrafts);

// Get single craft details
router.get('/:craftId', CraftController.getCraftById);

// Creator creates a new craft listing
router.post('/', verifyToken, requireRole('Creator'), uploadCraftPhotos, CraftController.createCraft);

module.exports = router;
