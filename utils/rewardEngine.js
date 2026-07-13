const UserModel = require('../models/userModel');

const RewardEngine = {
  /**
   * Calculate points based on weight and contribution type.
   */
  calculatePoints(weight, contributionType) {
    let multiplier = 1;
    switch(contributionType) {
      case 'Plastic': multiplier = 1.5; break;
      case 'E-Waste': multiplier = 2.0; break;
      case 'Organic': multiplier = 0.5; break;
      default: multiplier = 1.0;
    }
    return Math.floor(weight * multiplier * 10);
  },

  /**
   * Add points to a user and check for milestones.
   */
  async addPointsToUser(userId, points) {
    const user = await UserModel.findById(userId);
    if (!user) return;
    
    const newPoints = (user.greenPoints || 0) + points;
    await UserModel.updateGreenPoints(userId, points);
    
    // Check milestones
    this.checkMilestones(userId, newPoints);
  },

  /**
   * Internal milestone checker. (Could trigger emails or notifications in the future)
   */
  checkMilestones(userId, currentPoints) {
    if (currentPoints >= 1000 && currentPoints < 1050) {
      console.log(`[RewardEngine] User ${userId} reached Eco-Warrior milestone!`);
    } else if (currentPoints >= 5000 && currentPoints < 5050) {
      console.log(`[RewardEngine] User ${userId} reached Sustainability Champion milestone!`);
    }
  }
};

module.exports = RewardEngine;
