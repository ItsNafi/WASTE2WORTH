/**
 * Mock Payment Gateway to simulate transactions.
 */
const PaymentGateway = {
  /**
   * Simulate Bhangari shop paying a Citizen for scrap.
   */
  async processBhangariToCitizen(bhangariId, citizenId, amount) {
    console.log(`[PaymentGateway] Processing $${amount} from Bhangari(ID:${bhangariId}) to Citizen(ID:${citizenId})`);
    return this._simulateDelayAndSuccess();
  },

  /**
   * Simulate Bhangari shop donating to a Cleanup Campaign Fund.
   */
  async processBhangariToCampaignFund(bhangariId, campaignId, amount) {
    console.log(`[PaymentGateway] Processing $${amount} from Bhangari(ID:${bhangariId}) to Campaign(ID:${campaignId})`);
    return this._simulateDelayAndSuccess();
  },

  /**
   * Simulate Customer buying an upcycled craft from a Creator.
   */
  async processCustomerToCreator(customerId, creatorId, amount) {
    console.log(`[PaymentGateway] Processing $${amount} from Customer(ID:${customerId}) to Creator(ID:${creatorId})`);
    return this._simulateDelayAndSuccess();
  },

  _simulateDelayAndSuccess() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase() });
      }, 800);
    });
  }
};

module.exports = PaymentGateway;
