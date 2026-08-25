const express = require('express');
const HeatMapController = require('../controllers/heatMapController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, HeatMapController.getData);

module.exports = router;
