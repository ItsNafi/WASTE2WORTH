/**
 * routes/adminActivityRoutes.js
 * Routes for Admin-created activities
 */
const express                 = require('express');
const router                  = express.Router();
const AdminActivityController = require('../controllers/adminActivityController');
const { verifyToken }         = require('../middleware/authMiddleware');
const { requireRole }         = require('../middleware/roleMiddleware');

/* Get activities (Active for volunteers, all for Admin) */
router.get('/',                            verifyToken, AdminActivityController.getAllActivities);

/* Admin-only endpoints */
router.post('/',                           verifyToken, requireRole('Admin'), AdminActivityController.createActivity);
router.patch('/:id/toggle',                verifyToken, requireRole('Admin'), AdminActivityController.toggleActivity);
router.delete('/:id',                      verifyToken, requireRole('Admin'), AdminActivityController.deleteActivity);

module.exports = router;
