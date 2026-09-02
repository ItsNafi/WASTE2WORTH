const express         = require('express');
const router          = express.Router();
const CraftController = require('../controllers/craftController');
const { verifyToken }      = require('../middleware/authMiddleware');
const { requireRole }      = require('../middleware/roleMiddleware');
const { uploadCraftPhotos } = require('../middleware/uploadMiddleware');

router.get('/', CraftController.getAllCrafts);
router.get('/my/list', verifyToken, CraftController.getMyCrafts);
router.get('/:craftId', CraftController.getCraftById);
router.post('/', verifyToken, uploadCraftPhotos, CraftController.createCraft);
router.post('/:craftId/restock', verifyToken, requireRole('Creator'), CraftController.restockCraft);

// Reviews
router.get('/:craftId/reviews', CraftController.getReviews);
router.post('/:craftId/reviews', CraftController.addReview);

module.exports = router;
