// Direct test: bypass HTTP, test the models and controller logic directly
const path = require('path');
// Load from project root
const pool = require(path.join(__dirname, '..', 'config', 'db'));
const PaymentModel = require(path.join(__dirname, '..', 'models', 'paymentModel'));
const NotificationModel = require(path.join(__dirname, '..', 'models', 'notificationModel'));

async function run() {
  try {
    console.log('=== Step 1: Test NotificationModel.create ===');
    const notif = await NotificationModel.create({
      userId: 7,
      message: 'TEST: Direct notification creation test'
    });
    console.log('Created notification:', notif);

    console.log('\n=== Step 2: Test NotificationModel.findByUser ===');
    const notifs = await NotificationModel.findByUser(7);
    console.log('Notifications for user 7 count:', notifs.length);
    notifs.forEach(x => console.log('  -', x.id, x.message, x.isRead));

    console.log('\n=== Step 3: Test PaymentModel.getCreatorProfit ===');
    const profit = await PaymentModel.getCreatorProfit(7);
    console.log('Creator 7 profit:', profit);

    console.log('\n=== Step 4: Test PaymentModel.getCreatorSales ===');
    const sales = await PaymentModel.getCreatorSales(7);
    console.log('Creator 7 sales count:', sales.length);
    sales.forEach(s => console.log('  -', s.craftTitle, s.buyerName, s.amount));

    console.log('\n=== Step 5: Check existing Payments for creator 7 ===');
    const [payments] = await pool.execute(
      "SELECT * FROM Payments WHERE receiverId = 7 AND type = 'CustomerCheckout'"
    );
    console.log('Payment rows:', payments.length);
    payments.forEach(r => console.log('  -', r.paymentId, r.amount, r.senderId));

    console.log('\n=== Step 6: All notifications in DB ===');
    const [allNotifs] = await pool.execute('SELECT * FROM Notifications');
    console.log('Total notifications:', allNotifs.length);
    allNotifs.forEach(n => console.log('  -', n.id, 'user:', n.userId, n.message, 'read:', n.isRead));

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  } finally {
    process.exit();
  }
}

run();
