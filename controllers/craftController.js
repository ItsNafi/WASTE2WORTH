const CraftModel = require('../models/craftModel');
const UserModel  = require('../models/userModel');

const CraftController = {
  /** Creator lists a new upcycled craft with before/after photos. */
  async createCraft(req, res) {
    try {
      const { title, description, price, inventoryCount, storyNarrative } = req.body;
      const creatorId = req.user.id;

      if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required' });
      }
      if (parseFloat(price) <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      let beforePhotoUrl = null;
      let afterPhotoUrl  = null;

      if (req.files) {
        if (req.files.beforePhoto?.[0]) {
          beforePhotoUrl = '/uploads/' + req.files.beforePhoto[0].filename;
        }
        if (req.files.afterPhoto?.[0]) {
          afterPhotoUrl = '/uploads/' + req.files.afterPhoto[0].filename;
        }
      }

      const craft = await CraftModel.create({
        creatorId,
        title,
        description,
        price:          parseFloat(price),
        inventoryCount: parseInt(inventoryCount) || 1,
        beforePhotoUrl,
        afterPhotoUrl,
        storyNarrative
      });

      // Award 30 green points for creating an upcycled craft
      await UserModel.updateGreenPoints(creatorId, 30);

      res.status(201).json({ message: 'Craft listed successfully!', craft });
    } catch (err) {
      console.error('Create craft error:', err);
      res.status(500).json({ error: 'Failed to create craft listing' });
    }
  },

  /** Public: Retrieve all crafts for the storefront. */
  async getAllCrafts(_req, res) {
    try {
      const crafts = await CraftModel.findAll();
      res.json(crafts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch crafts' });
    }
  },

  /** Creator: Retrieve own craft listings. */
  async getMyCrafts(req, res) {
    try {
      const crafts = await CraftModel.findByCreator(req.user.id);
      res.json(crafts);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch your crafts' });
    }
  },

  /** Retrieve a single craft by ID. */
  async getCraftById(req, res) {
    try {
      const craft = await CraftModel.findById(req.params.craftId);
      if (!craft) return res.status(404).json({ error: 'Craft not found' });
      res.json(craft);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch craft details' });
    }
  }
};

module.exports = CraftController;
