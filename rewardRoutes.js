const express = require('express');
const router = express.Router();
const RewardController = require('../controllers/rewardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/milestones', verifyToken, RewardController.listMilestones);
router.post(
  '/certificates/:milestoneKey',
  verifyToken,
  RewardController.issueCertificate
);
router.get(
  '/certificates/:certificateId/download',
  verifyToken,
  RewardController.downloadByCertificateId
);
router.get('/verify/:certificateId', RewardController.verifyCertificate);

// Backwards-compatible endpoint: downloads the user's highest earned certificate.
router.get('/certificate', verifyToken, RewardController.downloadCertificate);

module.exports = router;
