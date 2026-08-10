const express    = require('express');
const router     = express.Router();
const VolunteerController = require('../controllers/volunteerController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

/* ── User routes (any authenticated user) ─────────────────────── */
router.post  ('/register',   verifyToken, VolunteerController.registerVolunteer);
router.get   ('/me',         verifyToken, VolunteerController.getMyProfile);
router.put   ('/me',         verifyToken, VolunteerController.updateMyProfile);
router.patch ('/me/status',  verifyToken, VolunteerController.toggleStatus);

/* ── Admin routes ─────────────────────────────────────────────── */
router.get ('/',    verifyToken, requireRole('Admin'), VolunteerController.getAllVolunteers);
router.get ('/:id', verifyToken, requireRole('Admin'), VolunteerController.getVolunteerById);

module.exports = router;
