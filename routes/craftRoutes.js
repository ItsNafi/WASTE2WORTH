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

module.exports = router;
