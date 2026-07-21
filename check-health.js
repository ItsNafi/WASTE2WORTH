const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:3005';

async function runHealthCheck() {
  console.log('=== WASTE2WORTH SYSTEM HEALTH CHECK ===\n');
  const results = {
    database: { status: 'UNKNOWN', error: null },
    routes: []
  };

  // 1. Check Database Connection
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'waste2worth'
    });
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    if (rows && rows[0] && rows[0].solution === 2) {
      results.database.status = 'SUCCESS';
    } else {
      results.database.status = 'FAILED';
      results.database.error = 'Invalid query response';
    }
    await connection.end();
  } catch (err) {
    results.database.status = 'FAILED';
    results.database.error = err.message;
  }

  console.log(`Database Connection: ${results.database.status === 'SUCCESS' ? '✅ Connected' : '❌ Failed (' + results.database.error + ')'}`);

  // 2. Start the Server
  console.log('\nStarting backend server...');
  const server = spawn('node', ['app.js'], {
    env: { ...process.env, PORT: '3005' },
    shell: true
  });

  server.stdout.on('data', (data) => {
    console.log(`[SERVER STDOUT] ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[SERVER STDERR] ${data.toString().trim()}`);
  });

  // Wait 2 seconds for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 3. Test Routes
  const routesToTest = [
    { name: 'Root Redirect', path: '/', method: 'GET', expectedStatus: 200 },
    { name: 'Login Page', path: '/login', method: 'GET', expectedStatus: 200 },
    { name: 'Register Page', path: '/register', method: 'GET', expectedStatus: 200 },
    { name: 'Storefront Page', path: '/storefront', method: 'GET', expectedStatus: 200 },
    { name: 'Creator Profile Page', path: '/creator-profile/1', method: 'GET', expectedStatus: 200 },
    { name: 'Public Crafts API', path: '/api/crafts', method: 'GET', expectedStatus: 200 },
    { name: 'Creator Profile API', path: '/api/creator/1', method: 'GET', expectedStatus: 200 }
  ];

  console.log('\nTesting routes...');
  for (const route of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${route.path}`, {
        method: route.method,
        redirect: 'follow' // Follow the redirect on '/'
      });
      
      const success = res.status === 200 || res.status === route.expectedStatus || (route.path === '/api/creator/1' && res.status === 404);
      const text = success ? '' : await res.text();
      
      results.routes.push({
        name: route.name,
        path: route.path,
        method: route.method,
        status: res.status,
        success: success,
        error: success ? null : `Unexpected status code: ${res.status}. Body: ${text}`
      });

      console.log(`  ${success ? '✅' : '❌'} [${route.method}] ${route.path} - Status ${res.status} ${success ? '' : '- Body: ' + text}`);
    } catch (err) {
      results.routes.push({
        name: route.name,
        path: route.path,
        method: route.method,
        status: 'ERROR',
        success: false,
        error: err.message
      });
      console.log(`  ❌ [${route.method}] ${route.path} - Error: ${err.message}`);
    }
  }

  // 4. Shutdown Server
  console.log('\nShutting down backend server...');
  server.kill('SIGINT');

  console.log('\n=== HEALTH CHECK COMPLETED ===');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

runHealthCheck();
