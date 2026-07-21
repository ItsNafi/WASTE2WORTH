const pool = require('./config/db');

(async () => {
  try {
    // Test creator 3 profit
    const [profit3] = await pool.execute(
      "SELECT SUM(amount) AS totalProfit FROM Payments WHERE receiverId = 3 AND type = 'CustomerCheckout'"
    );
    console.log('Creator 3 profit:', profit3);

    // Test creator 3 sales
    const [sales3] = await pool.execute(
      `SELECT p.*, s.name AS buyerName, c.title AS craftTitle 
       FROM Payments p 
       JOIN Users s ON p.senderId = s.id 
       LEFT JOIN UpcycledCrafts c ON p.referenceId = c.craftId 
       WHERE p.receiverId = 3 AND p.type = 'CustomerCheckout' 
       ORDER BY p.createdAt DESC`
    );
    console.log('Creator 3 sales:', JSON.stringify(sales3, null, 2));

    // Test creator 7 profit
    const [profit7] = await pool.execute(
      "SELECT SUM(amount) AS totalProfit FROM Payments WHERE receiverId = 7 AND type = 'CustomerCheckout'"
    );
    console.log('Creator 7 profit:', profit7);

    // Test creator 7 sales
    const [sales7] = await pool.execute(
      `SELECT p.*, s.name AS buyerName, c.title AS craftTitle 
       FROM Payments p 
       JOIN Users s ON p.senderId = s.id 
       LEFT JOIN UpcycledCrafts c ON p.referenceId = c.craftId 
       WHERE p.receiverId = 7 AND p.type = 'CustomerCheckout' 
       ORDER BY p.createdAt DESC`
    );
    console.log('Creator 7 sales:', JSON.stringify(sales7, null, 2));

    // Check all notifications
    const [notifs] = await pool.execute('SELECT * FROM Notifications ORDER BY createdAt DESC');
    console.log('All notifications:', JSON.stringify(notifs, null, 2));

    // Simulate what getCreatorProfile returns
    const PaymentModel = require('./models/paymentModel');
    const tp = await PaymentModel.getCreatorProfit(3);
    console.log('PaymentModel.getCreatorProfit(3):', tp);
    const sl = await PaymentModel.getCreatorSales(3);
    console.log('PaymentModel.getCreatorSales(3):', JSON.stringify(sl, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
