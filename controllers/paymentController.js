const PaymentModel = require('../models/paymentModel');
const CraftModel = require('../models/craftModel');
const CampaignModel = require('../models/campaignModel');
const UserModel = require('../models/userModel');
const PriceDirectoryModel = require('../models/priceDirectoryModel');
const NotificationModel = require('../models/notificationModel');

const PaymentController = {
  /** 1. Process typical consumer checkout for an upcycled craft (CustomerCheckout) */
  async checkoutCraft(req, res) {
    try {
      const { craftId } = req.params;
      const customerId = req.user.id; // Logged-in buyer

      const craft = await CraftModel.findById(craftId);
      if (!craft) {
        return res.status(404).json({ error: 'Craft product not found' });
      }
      
      if (craft.creatorId === customerId) {
        return res.status(400).json({ error: 'You cannot purchase your own product' });
      }

      if (craft.inventoryCount <= 0) {
        return res.status(400).json({ error: 'This craft is out of stock' });
      }

      // Decrement inventory by 1
      await CraftModel.updateInventory(craftId, -1);

      // Award points (Buyer: 10 green points, Creator: 15 green points)
      await UserModel.updateGreenPoints(customerId, 10);
      await UserModel.updateGreenPoints(craft.creatorId, 15);

      // Record simulated transaction
      const payment = await PaymentModel.create({
        senderId: customerId,
        receiverId: craft.creatorId,
        amount: craft.price,
        type: 'CustomerCheckout',
        referenceId: craftId
      });

      // Send notification to creator
      const buyer = await UserModel.findById(customerId);
      await NotificationModel.create({
        userId: craft.creatorId,
        message: `Payment received: ${buyer ? buyer.name : 'A customer'} purchased your product "${craft.title}" for $${craft.price}.`
      });

      res.status(201).json({ message: 'Checkout completed successfully! Thank you for supporting local artisans.', payment });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: 'Failed to process checkout transaction' });
    }
  },

  /** 2. Process Bhangari Shop buying volunteer campaign waste (BhangariToVolunteer) */
  async purchaseCampaignWaste(req, res) {
    try {
      const { registrationId } = req.params;
      const { category } = req.body; // e.g. Plastic, Metal, etc.
      const bhangariId = req.user.id;

      if (!category) {
        return res.status(400).json({ error: 'Waste category is required for pricing' });
      }

      const registration = await CampaignModel.findRegistrationById(registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Campaign registration record not found' });
      }
      if (registration.status !== 'Attended') {
        return res.status(400).json({ error: 'Volunteer must have attended the campaign to sell collected waste' });
      }
      if (parseFloat(registration.wasteCollectedKg) <= 0) {
        return res.status(400).json({ error: 'No waste was collected for this registration' });
      }

      // Calculate payment based on price directory
      const pricePerKg = await PriceDirectoryModel.getPriceByCategory(category);
      const amount = (parseFloat(registration.wasteCollectedKg) * pricePerKg) || 0.00;

      // Log payment with receiverId = null (representing Centralized Cleanup Campaign Fund)
      const payment = await PaymentModel.create({
        senderId: bhangariId,
        receiverId: null, 
        amount,
        type: 'BhangariToVolunteer',
        referenceId: registrationId
      });

      // Award points (Bhangari: 20 points, Volunteer/Campaign contributor: 10 points)
      await UserModel.updateGreenPoints(bhangariId, 20);
      await UserModel.updateGreenPoints(registration.volunteerId, 10);

      // Send notification to volunteer
      const bhangariUser = await UserModel.findById(bhangariId);
      await NotificationModel.create({
        userId: registration.volunteerId,
        message: `Payment received: ${bhangariUser ? bhangariUser.name : 'A buyer'} purchased your collected campaign waste (${registration.wasteCollectedKg} kg of ${category}) for $${amount.toFixed(2)}.`
      });

      res.status(201).json({ 
        message: `Waste purchased successfully! $${amount} has been routed to the central Cleanup Campaign Fund.`, 
        payment 
      });
    } catch (err) {
      console.error('Purchase campaign waste error:', err);
      res.status(500).json({ error: 'Failed to purchase campaign waste' });
    }
  },

  /** 3. Fetch the Centralized Cleanup Campaign Fund balance */
  async getCampaignFundBalance(req, res) {
    try {
      const balance = await PaymentModel.getCampaignFundBalance();
      res.json({ balance });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve campaign fund balance' });
    }
  },

  /** 4. Retrieve all attended registrations with waste collected for buying board */
  async getAttendedRegistrations(req, res) {
    try {
      const registrations = await CampaignModel.findAttendedRegistrations();
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch attended campaign registrations' });
    }
  },

  /** 5. Retrieve the logged-in user's full transaction history */
  async getMyTransactions(req, res) {
    try {
      const transactions = await PaymentModel.findByUser(req.user.id);
      res.json(transactions);
    } catch (err) {
      console.error('My transactions error:', err);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  }
};

module.exports = PaymentController;
