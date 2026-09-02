const express = require('express');
const router  = express.Router();
const PriceDirectoryController = require('../controllers/priceDirectoryController');
const { verifyToken }  = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

// ── Public routes (no auth required) ──────────────────────────────────────────
// GET /api/price-directory  → all active materials (users + guests)
router.get('/', PriceDirectoryController.getPublicDirectory);

// ── Admin-only routes ─────────────────────────────────────────────────────────
// GET /api/price-directory/admin  → all materials including inactive
router.get('/admin', verifyToken, requireRole('Admin'), PriceDirectoryController.getAdminDirectory);

// POST /api/price-directory  → add new material
router.post('/', verifyToken, requireRole('Admin'), PriceDirectoryController.addMaterial);

// PUT /api/price-directory/:id  → update material (price, description, etc.)
router.put('/:id', verifyToken, requireRole('Admin'), PriceDirectoryController.updateMaterial);

// PATCH /api/price-directory/:id/toggle  → activate / deactivate material
router.patch('/:id/toggle', verifyToken, requireRole('Admin'), PriceDirectoryController.toggleMaterial);

module.exports = router;
