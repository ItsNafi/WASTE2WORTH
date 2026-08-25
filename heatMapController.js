const HeatMapModel = require('../models/heatMapModel');

const HeatMapController = {
  async getData(_req, res) {
    try {
      const data = await HeatMapModel.getAggregatedData();
      res.json(data);
    } catch (err) {
      console.error('Heat map data error:', err);
      res.status(500).json({ error: 'Failed to load geographical waste data' });
    }
  }
};

module.exports = HeatMapController;
