const ScrapModel = require('../models/scrapModel');
const UserModel  = require('../models/userModel');
const CreatorModel = require('../models/creatorModel');
const RecyclingHistoryModel = require('../models/recyclingHistoryModel');
const ReviewModel = require('../models/reviewModel');
const PaymentModel = require('../models/paymentModel');

const CreatorController = {
  /** Fetch available scrap listings for creator sourcing. */
  async getRawMaterials(_req, res) {
    try {
      const listings = await ScrapModel.findAvailable();
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch raw materials' });
    }
  },

  /** Creator secures / reserves a raw material listing. */
  async purchaseRawMaterial(req, res) {
    try {
      const { listingId } = req.params;

      const listing = await ScrapModel.findById(listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      if (listing.status !== 'Available') {
        return res.status(400).json({ error: 'This material is no longer available' });
      }

      // Mark as reserved for upcycling
      await ScrapModel.updateStatus(listingId, 'Reserved');

      // Award green points to citizen seller (20 pts) and creator buyer (25 pts)
      await UserModel.updateGreenPoints(listing.ownerId, 20);
      await UserModel.updateGreenPoints(req.user.id, 25);

      // Record a recycling history event for the reserved material
      await RecyclingHistoryModel.create({
        creatorId: req.user.id,
        craftId: null,
        eventDate: new Date(),
        recycledKg: listing.weight,
        materials: listing.category,
        description: `Reserved ${listing.weight} kg of ${listing.category} material from seller ${listing.ownerName}`
      });

      res.json({ message: 'Raw material secured successfully!' });
    } catch (err) {
      console.error('Purchase raw material error:', err);
      res.status(500).json({ error: 'Failed to secure raw material' });
    }
  },

  /** Fetch creator profile details and their upcycled crafts. */
  async getCreatorProfile(req, res) {
    try {
      const { id } = req.params;
      const creator = await CreatorModel.getProfileById(id);

      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      const crafts = await CreatorModel.getCraftsByCreatorId(id);
      const reviews = await ReviewModel.findByCreatorId(id);
      const ratingInfo = await ReviewModel.getAverageRating(id);
      const totalProfit = await PaymentModel.getCreatorProfit(id);
      const sales = await PaymentModel.getCreatorSales(id);

      res.json({ creator, crafts, reviews, ratingInfo, totalProfit, sales });
    } catch (err) {
      console.error('Get creator profile error:', err);
      res.status(500).json({ error: 'Failed to fetch creator profile showcase' });
    }
  },

  /** Customer submits rating & review for an artisan/creator */
  async addCreatorReview(req, res) {
    try {
      const { id: creatorId } = req.params;
      const { rating, reviewText } = req.body;
      const customerId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid rating (1-5) is required' });
      }

      const review = await ReviewModel.create({
        creatorId,
        customerId,
        rating: parseInt(rating),
        reviewText
      });

      res.status(201).json({ message: 'Review submitted successfully!', review });
    } catch (err) {
      console.error('Add creator review error:', err);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  },

  /** Fetch creator profit and sales history (for their own dashboard) */
  async getMySales(req, res) {
    try {
      const creatorId = req.user.id;
      const PaymentModel = require('../models/paymentModel');
      const totalProfit = await PaymentModel.getCreatorProfit(creatorId);
      const sales = await PaymentModel.getCreatorSales(creatorId);
      res.json({ totalProfit, sales });
    } catch (err) {
      console.error('Get my sales error:', err);
      res.status(500).json({ error: 'Failed to fetch sales data' });
    }
  }
};

module.exports = CreatorController;
