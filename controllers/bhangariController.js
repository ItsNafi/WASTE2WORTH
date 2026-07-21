const ScrapModel = require('../models/scrapModel');
const UserModel  = require('../models/userModel');
const PriceDirectoryModel = require('../models/priceDirectoryModel');
const PaymentModel = require('../models/paymentModel');
const NotificationModel = require('../models/notificationModel');

const BhangariController = {
  /** Fetch all scrap listings for the buying board. */
  async getBoard(_req, res) {
    try {
      const listings = await ScrapModel.findAll();
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch board data' });
    }
  },

  /** Bhangari shop purchases a scrap listing. */
  async purchaseScrap(req, res) {
    try {
      const { listingId } = req.params;

      const listing = await ScrapModel.findById(listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      if (listing.status !== 'Available') {
        return res.status(400).json({ error: 'This listing is no longer available' });
      }

      // Calculate transaction amount using PriceDirectory
      const pricePerKg = await PriceDirectoryModel.getPriceByCategory(listing.category);
      const amount = (listing.weight * pricePerKg) || 0.00;

      // Mark as sold
      await ScrapModel.updateStatus(listingId, 'Sold');

      // Award green points to the citizen seller (20 pts)
      await UserModel.updateGreenPoints(listing.ownerId, 20);

      // Award green points to the bhangari buyer (15 pts)
      await UserModel.updateGreenPoints(req.user.id, 15);

      // Log simulated payment
      const payment = await PaymentModel.create({
        senderId: req.user.id,
        receiverId: listing.ownerId,
        amount,
        type: 'BhangariToCitizen',
        referenceId: listingId
      });

      // Send notification to the citizen seller
      const bhangariUser = await UserModel.findById(req.user.id);
      await NotificationModel.create({
        userId: listing.ownerId,
        message: `Payment received: ${bhangariUser ? bhangariUser.name : 'A buyer'} purchased your ${listing.category} scrap listing (${listing.weight} kg) for $${amount.toFixed(2)}.`
      });

      res.json({ message: 'Scrap purchased successfully!', payment });
    } catch (err) {
      console.error('Purchase error:', err);
      res.status(500).json({ error: 'Failed to complete purchase' });
    }
  }
};

module.exports = BhangariController;
