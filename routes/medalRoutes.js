/**
 * routes/medalRoutes.js
 * Admin-awarded volunteer achievement medals
 */
const express          = require('express');
const router           = express.Router();
const MedalController  = require('../controllers/medalController');
const { verifyToken }  = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

// Public catalogue (no auth needed — used by both admin & volunteer pages)
router.get('/catalogue', MedalController.getCatalogue);

// Volunteer: see own medals
router.get('/my', verifyToken, MedalController.getMy);

// Anyone authenticated: fetch medals for a specific volunteer
router.get('/volunteer/:volunteerId', verifyToken, MedalController.getForVolunteer);

// Admin only
router.post('/award/:volunteerId', verifyToken, requireRole('Admin'), MedalController.award);
router.delete('/:medalId',          verifyToken, requireRole('Admin'), MedalController.revoke);

module.exports = router;
