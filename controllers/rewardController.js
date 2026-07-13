const PDFGenerator = require('../utils/pdfGenerator');
const UserModel = require('../models/userModel');

const RewardController = {
  async downloadCertificate(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).send('User not found');
      
      let type = 'Eco-Warrior';
      if (user.role === 'Volunteer') type = 'Top-Volunteer';
      if (user.greenPoints > 5000) type = 'Sustainability Champion';

      PDFGenerator.generateCertificate(res, user, type);
    } catch (err) {
      console.error(err);
      res.status(500).send('Failed to generate certificate');
    }
  }
};

module.exports = RewardController;
