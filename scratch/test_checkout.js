const fetch = require('node-fetch'); // wait, I can just use http module or native fetch if node 18+

(async () => {
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: 3, role: 'Creator' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

  console.log('Sending request...');
  const res = await fetch('http://localhost:3000/api/payments/checkout/109', {
    method: 'POST',
    headers: {
      'Cookie': `token=${token}`
    }
  });

  console.log(res.status, await res.text());
})();
