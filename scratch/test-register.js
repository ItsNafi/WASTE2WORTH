const { spawn } = require('child_process');
require('dotenv').config();

async function testRegistration() {
  console.log('Starting backend server for register debug...');
  const server = spawn('node', ['app.js'], {
    env: { ...process.env, PORT: '3006' },
    shell: true
  });

  server.stdout.on('data', (data) => {
    console.log(`[STDOUT] ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[STDERR] ${data.toString().trim()}`);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  const email = `test_qa_${Date.now()}@example.com`;
  console.log(`Attempting to register user with email: ${email}`);

  try {
    const res = await fetch('http://localhost:3006/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'QA Tester',
        email: email,
        password: 'password123',
        role: 'Citizen'
      })
    });

    const status = res.status;
    const body = await res.json();
    console.log(`Response Status: ${status}`);
    console.log('Response Body:', body);
  } catch (err) {
    console.error('Fetch request failed:', err.message);
  }

  console.log('Shutting down server...');
  server.kill();
  process.exit(0);
}

testRegistration();
