const express           = require('express');
const router            = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyToken }   = require('../middleware/authMiddleware');
const { requireRole }   = require('../middleware/roleMiddleware');

// Checkout standard craft product (standard customer checkout)
router.post('/checkout/:craftId', verifyToken, PaymentController.checkoutCraft);

// Bhangari Shop buys volunteer collected waste (routed to campaign fund)
router.post('/purchase-campaign-waste/:registrationId', verifyToken, requireRole('BhangariShop'), PaymentController.purchaseCampaignWaste);

// Get total centralized cleanup campaign fund balance
router.get('/campaign-fund', verifyToken, PaymentController.getCampaignFundBalance);

// Get attended campaign registrations with waste collected for buying board
router.get('/attended-registrations', verifyToken, requireRole('BhangariShop'), PaymentController.getAttendedRegistrations);

// Get logged-in user's full transaction history
router.get('/my', verifyToken, PaymentController.getMyTransactions);

module.exports = router;
