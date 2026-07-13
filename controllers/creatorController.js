const ScrapModel = require('../models/scrapModel');
const UserModel  = require('../models/userModel');

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

      res.json({ message: 'Raw material secured successfully!' });
    } catch (err) {
      console.error('Purchase raw material error:', err);
      res.status(500).json({ error: 'Failed to secure raw material' });
    }
  }
};

module.exports = CreatorController;
