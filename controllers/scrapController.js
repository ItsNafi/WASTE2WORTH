const ScrapModel = require('../models/scrapModel');
const UserModel  = require('../models/userModel');

const ScrapController = {
  /** Citizen creates a new scrap listing. */
  async createListing(req, res) {
    try {
      const { category, weight } = req.body;
      const ownerId = req.user.id;

      if (!category || !weight) {
        return res.status(400).json({ error: 'Category and weight are required' });
      }
      if (parseFloat(weight) <= 0) {
        return res.status(400).json({ error: 'Weight must be greater than 0' });
      }

      const photoUrl = req.file ? '/uploads/' + req.file.filename : null;
      const listing  = await ScrapModel.create({
        ownerId,
        category,
        weight: parseFloat(weight),
        photoUrl
      });

      // Award 10 green points for listing scrap
      await UserModel.updateGreenPoints(ownerId, 10);

      res.status(201).json({ message: 'Scrap listing created successfully', listing });
    } catch (err) {
      console.error('Create listing error:', err);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  },

  /** Citizen retrieves their own listings. */
  async getMyListings(req, res) {
    try {
      const listings = await ScrapModel.findByOwner(req.user.id);
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  /** Retrieve all listings (admin / general). */
  async getAllListings(_req, res) {
    try {
      const listings = await ScrapModel.findAll();
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  },

  /** Retrieve only available listings. */
  async getAvailableListings(_req, res) {
    try {
      const listings = await ScrapModel.findAvailable();
      res.json(listings);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch available listings' });
    }
  }
};

module.exports = ScrapController;
