const PriceDirectoryModel = require('../models/priceDirectoryModel');
const path = require('path');
const fs   = require('fs');

const PriceDirectoryController = {

  /** GET /price-directory  (and /dashboard/citizen/price-directory)
   *  Serves the HTML page with the user's role injected server-side
   *  so the sidebar script never needs to read the httpOnly cookie.
   */
  servePage(req, res) {
    const role = req.user?.role || '';
    const filePath = path.join(__dirname, '..', 'views', 'citizen', 'priceDirectory.html');
    try {
      let html = fs.readFileSync(filePath, 'utf8');
      // Inject role before </head> so sidebar script can use window.__ROLE__
      html = html.replace(
        '</head>',
        `<script>window.__ROLE__ = ${JSON.stringify(role)};</script>\n</head>`
      );
      res.type('html').send(html);
    } catch (err) {
      res.status(500).send('<h2>500</h2><p>Could not load price directory page.</p>');
    }
  },

  /** GET /api/price-directory
   *  Public — returns all active materials. No authentication required.
   */
  async getPublicDirectory(_req, res) {
    try {
      const materials = await PriceDirectoryModel.getActiveAll();
      res.json(materials);
    } catch (err) {
      console.error('getPublicDirectory error:', err);
      res.status(500).json({ error: 'Failed to fetch price directory' });
    }
  },

  /** GET /api/price-directory/admin
   *  Admin only — returns ALL materials including inactive ones.
   */
  async getAdminDirectory(_req, res) {
    try {
      const materials = await PriceDirectoryModel.getAllAdmin();
      res.json(materials);
    } catch (err) {
      console.error('getAdminDirectory error:', err);
      res.status(500).json({ error: 'Failed to fetch admin price directory' });
    }
  },

  /** POST /api/price-directory
   *  Admin only — add a new scrap material.
   */
  async addMaterial(req, res) {
    try {
      const { categoryName, displayCategory, pricePerKg, description, icon } = req.body;

      if (!categoryName || !pricePerKg) {
        return res.status(400).json({ error: 'Material name and price are required' });
      }
      if (parseFloat(pricePerKg) < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }

      const insertId = await PriceDirectoryModel.addMaterial({
        categoryName: categoryName.trim(),
        displayCategory: displayCategory || 'Other',
        pricePerKg: parseFloat(pricePerKg),
        description: description || null,
        icon: icon || '♻️',
        isActive: 1
      });

      const newMaterial = await PriceDirectoryModel.getById(insertId);
      res.status(201).json({ message: 'Material added successfully', material: newMaterial });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A material with that name already exists' });
      }
      console.error('addMaterial error:', err);
      res.status(500).json({ error: 'Failed to add material' });
    }
  },

  /** PUT /api/price-directory/:id
   *  Admin only — update material price, description, icon, category.
   */
  async updateMaterial(req, res) {
    try {
      const { id } = req.params;
      const { pricePerKg, description, icon, displayCategory, categoryName } = req.body;

      const existing = await PriceDirectoryModel.getById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Material not found' });
      }

      if (pricePerKg !== undefined && parseFloat(pricePerKg) < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }

      await PriceDirectoryModel.updateMaterial(id, {
        pricePerKg:      pricePerKg      !== undefined ? parseFloat(pricePerKg) : undefined,
        description:     description     !== undefined ? description.trim()     : undefined,
        icon:            icon            !== undefined ? icon.trim()             : undefined,
        displayCategory: displayCategory !== undefined ? displayCategory.trim() : undefined,
        categoryName:    categoryName    !== undefined ? categoryName.trim()    : undefined
      });

      const updated = await PriceDirectoryModel.getById(id);
      res.json({ message: 'Material updated successfully', material: updated });
    } catch (err) {
      console.error('updateMaterial error:', err);
      res.status(500).json({ error: 'Failed to update material' });
    }
  },

  /** PATCH /api/price-directory/:id/toggle
   *  Admin only — activate or deactivate a material.
   */
  async toggleMaterial(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({ error: 'isActive field is required' });
      }

      const existing = await PriceDirectoryModel.getById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Material not found' });
      }

      await PriceDirectoryModel.toggleActive(id, isActive);
      res.json({ message: `Material ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
      console.error('toggleMaterial error:', err);
      res.status(500).json({ error: 'Failed to toggle material status' });
    }
  }
};

module.exports = PriceDirectoryController;
