const RecyclingHistoryModel = require('../models/recyclingHistoryModel');

const RecyclingHistoryController = {
  async getCreatorHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await RecyclingHistoryModel.findByCreator(id);
      const summary = await RecyclingHistoryModel.getSummaryByCreator(id);
      res.json({ history, summary });
    } catch (err) {
      console.error('Get creator recycling history error:', err);
      res.status(500).json({ error: 'Failed to fetch recycling history' });
    }
  }
};

module.exports = RecyclingHistoryController;
