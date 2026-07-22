const express = require('express');
const router = express.Router();
const RecyclingHistoryController = require('../controllers/recyclingHistoryController');

router.get('/creator/:id', RecyclingHistoryController.getCreatorHistory);

module.exports = router;
