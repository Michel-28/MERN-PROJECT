const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: __dirname + '/.env' });
const app = require('./src/app');

async function runGoogleAuthTests() {
  console.log('\n--- Running Google Authentication Automated Tests ---');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelease');
  console.log('✓ Connected to MongoDB');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const apiRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(
        url,
        { method, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode,
                body: data ? JSON.parse(data) : {},
              });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    const randomSuffix = Date.now();
    const testTravelerEmail = `google.traveler.${randomSuffix}@gmail.com`;

    const createTestGoogleToken = (email, name) => {
      return jwt.sign(
        {
          email,
          name,
          picture: 'https://example.com/avatar.jpg',
          sub: `google_sub_${randomSuffix}`,
        },
        'test_secret_for_mocking_google_jwt'
      );
    };

    // Test 1: User Google Registration & Login
    const res1 = await apiRequest('/auth/google', 'POST', {
      role: 'user',
      credential: createTestGoogleToken(testTravelerEmail, 'Google Traveler'),
    });

    if (res1.status === 200 && res1.body.success && res1.body.token && res1.body.user.email === testTravelerEmail) {
      console.log('PASS: 1. Traveler can register and login with Google Auth credential token');
    } else {
      throw new Error(`Test 1 Failed: ${res1.status} - ${JSON.stringify(res1.body)}`);
    }

    // Test 2: Existing User Subsequent Login with Google
    const res2 = await apiRequest('/auth/google', 'POST', {
      role: 'user',
      credential: createTestGoogleToken(testTravelerEmail, 'Google Traveler Updated'),
    });

    if (res2.status === 200 && res2.body.success && res2.body.user.role === 'user') {
      console.log('PASS: 2. Existing traveler seamlessly logs in via Google Auth token');
    } else {
      throw new Error(`Test 2 Failed: ${res2.status} - ${JSON.stringify(res2.body)}`);
    }

    // Test 3: Non-Admin Email Attempting Admin Login via Google (Must be rejected with 403)
    const res3 = await apiRequest('/auth/google', 'POST', {
      role: 'admin',
      credential: createTestGoogleToken(testTravelerEmail, 'Unauthorized Admin Attempt'),
    });

    if (res3.status === 403 && res3.body.success === false) {
      console.log('PASS: 3. Non-admin Google account is rejected from Admin Portal (403 Forbidden)');
    } else {
      throw new Error(`Test 3 Failed: ${res3.status} - ${JSON.stringify(res3.body)}`);
    }

    // Test 4: Administrator Google Login with Authorized Admin Email
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@travelease.com').toLowerCase();
    const res4 = await apiRequest('/auth/google', 'POST', {
      role: 'admin',
      credential: createTestGoogleToken(adminEmail, 'TravelEase Administrator'),
    });

    if (res4.status === 200 && res4.body.success && res4.body.user.role === 'admin') {
      console.log('PASS: 4. Authorized Administrator can log in via Google Auth with admin privileges');
    } else {
      throw new Error(`Test 4 Failed: ${res4.status} - ${JSON.stringify(res4.body)}`);
    }

    // Test 5: Verify that the issued admin token can access protected admin APIs
    const adminToken = res4.body.token;
    const res5 = await apiRequest('/admin/dashboard/stats', 'GET', null, adminToken);

    if (res5.status === 200 && res5.body.success) {
      console.log('PASS: 5. Admin token from Google Auth accesses protected admin endpoints');
    } else {
      throw new Error(`Test 5 Failed: ${res5.status} - ${JSON.stringify(res5.body)}`);
    }

    console.log('\n================ ALL GOOGLE AUTH TESTS PASSED (5/5) ================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runGoogleAuthTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });
