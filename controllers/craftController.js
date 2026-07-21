const CraftModel = require('../models/craftModel');
const UserModel  = require('../models/userModel');
const RecyclingHistoryModel = require('../models/recyclingHistoryModel');

const CraftController = {
  /** Creator lists a new upcycled craft with before/after photos. */
  async createCraft(req, res) {
    try {
      // Debug: log incoming form data and files to help diagnose missing category
      console.log('createCraft request body:', req.body);
      console.log('createCraft request files:', req.files);
      const { title, description, price, inventoryCount, storyNarrative, category: rawCategory } = req.body;
      const creatorId = req.user.id;
      const category = typeof rawCategory === 'string' ? rawCategory.trim() : 'Home Decor';
      const safeCategory = category || 'Home Decor';

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
        category: safeCategory,
        price:          parseFloat(price),
        inventoryCount: parseInt(inventoryCount) || 1,
        beforePhotoUrl,
        afterPhotoUrl,
        storyNarrative
      });

      // Record craft creation in recycling history so category-based history appears
      await RecyclingHistoryModel.create({
        creatorId,
        craftId: craft.craftId,
        eventDate: new Date(),
        recycledKg: 0,
        materials: safeCategory,
        description: `Created a new ${safeCategory} craft: ${title}`
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
  },

  /** Restock an existing craft. */
  async restockCraft(req, res) {
    try {
      const { craftId } = req.params;
      const { quantity } = req.body;
      const amount = parseInt(quantity, 10);
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid restock quantity' });
      }

      const craft = await CraftModel.findById(craftId);
      if (!craft) return res.status(404).json({ error: 'Craft not found' });
      if (craft.creatorId !== req.user.id) {
        return res.status(403).json({ error: 'You do not own this craft' });
      }

      await CraftModel.updateInventory(craftId, amount);
      res.json({ message: 'Restocked successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to restock craft' });
    }
  }
};

module.exports = CraftController;
