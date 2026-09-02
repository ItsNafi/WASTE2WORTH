/**
 * routes/badgeRoutes.js
 * Feature 14 — Milestone Achievement Badges
 */
const express          = require('express');
const router           = express.Router();
const BadgeController  = require('../controllers/badgeController');
const { verifyToken }  = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

/* All badge routes require authentication */
router.post('/activities',  verifyToken, BadgeController.logActivity);
router.get ('/activities',  verifyToken, BadgeController.getActivities);
router.get ('/my-badges',   verifyToken, BadgeController.getMyBadges);

/* Admin routes */
router.get ('/admin/overview',          verifyToken, requireRole('Admin'), BadgeController.getAdminVolunteerOverview);
router.post('/award/:volunteerId',      verifyToken, requireRole('Admin'), BadgeController.awardBadgeToVolunteer);
router.get ('/volunteer/:volunteerId',  verifyToken, requireRole('Admin'), BadgeController.getVolunteerActivitiesForAdmin);

module.exports = router;
