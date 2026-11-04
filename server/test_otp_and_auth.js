const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: __dirname + '/.env' });
const app = require('./src/app');
const User = require('./src/models/User');

async function runOtpAndAuthTests() {
  console.log('\n=================== RUNNING OTP & AUTHENTICATION TESTS ===================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelease');
  console.log('✓ Connected to MongoDB');

  // Ensure DB init auto-verification runs for legacy accounts
  await User.updateMany(
    {
      $or: [
        { isEmailVerified: { $exists: false } },
        { role: 'admin' },
        { authProvider: 'google' },
      ],
    },
    { $set: { isEmailVerified: true } }
  );

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
    const timestamp = Date.now();
    const testEmail = `new.traveler.${timestamp}@example.com`;
    const testPassword = 'Password@TravelEase2026';

    // 1. New Registration generates OTP and creates unverified account
    const regRes = await apiRequest('/auth/register', 'POST', {
      name: 'Priya OTP Tester',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      phone: '+91 9876543210',
    });

    if (regRes.status === 201 && regRes.body.requiresOtp && regRes.body.testOtp) {
      console.log('PASS: 1. New registration succeeds and dispatches 6-digit OTP');
    } else {
      throw new Error(`Test 1 Failed: ${regRes.status} - ${JSON.stringify(regRes.body)}`);
    }

    const testOtp = regRes.body.testOtp;

    // Check DB state: isEmailVerified must be false and role must be 'user'
    const dbUserUnverified = await User.findOne({ email: testEmail });
    if (dbUserUnverified.isEmailVerified === false && dbUserUnverified.role === 'user') {
      console.log('PASS: 2. New account is created unverified with normal user role');
    } else {
      throw new Error('Test 2 Failed: User verification status or role incorrect');
    }

    // 2. Prevent unverified login before OTP verification (Requirement 7)
    const prematureLogin = await apiRequest('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });

    if (prematureLogin.status === 403 && prematureLogin.body.isEmailVerified === false) {
      console.log('PASS: 3. Unverified account cannot log in before entering valid OTP (403 Forbidden)');
    } else {
      throw new Error(`Test 3 Failed: Unverified user allowed to log in: ${prematureLogin.status}`);
    }

    // 3. Reject Incorrect OTP (Requirement 6)
    const wrongOtpRes = await apiRequest('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: '000000',
    });

    if (wrongOtpRes.status === 400 && wrongOtpRes.body.success === false) {
      console.log('PASS: 4. Incorrect OTP is rejected');
    } else {
      throw new Error(`Test 4 Failed: Incorrect OTP was accepted: ${wrongOtpRes.status}`);
    }

    // 4. Reject Expired OTP (Requirement 3 & 6)
    await User.updateOne({ email: testEmail }, { 'otp.expiresAt': new Date(Date.now() - 1000) });
    const expiredRes = await apiRequest('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: testOtp,
    });

    if (expiredRes.status === 400 && expiredRes.body.message.includes('expired')) {
      console.log('PASS: 5. Expired OTP (>5 min) is strictly rejected');
    } else {
      throw new Error(`Test 5 Failed: Expired OTP was accepted: ${expiredRes.status}`);
    }

    // 5. Resend OTP Cooldown (Requirement 4)
    // Attempt resend immediately:
    const immediateResend = await apiRequest('/auth/resend-otp', 'POST', { email: testEmail });
    if (immediateResend.status === 429) {
      console.log('PASS: 6. Resend OTP enforces 60-second cooldown (429 Rate Limit)');
    } else {
      throw new Error(`Test 6 Failed: Cooldown not enforced: ${immediateResend.status}`);
    }

    // Advance lastSentAt past 60s cooldown and resend
    await User.updateOne({ email: testEmail }, { 'otp.lastSentAt': new Date(Date.now() - 65 * 1000) });
    const resendRes = await apiRequest('/auth/resend-otp', 'POST', { email: testEmail });
    if (resendRes.status === 200 && resendRes.body.success && resendRes.body.testOtp) {
      console.log('PASS: 7. Resend OTP delivers new 6-digit OTP after cooldown');
    } else {
      throw new Error(`Test 7 Failed: Resend failed: ${resendRes.status}`);
    }

    const newOtp = resendRes.body.testOtp;

    // 6. Successful OTP Verification activates account & returns JWT (Requirement 5)
    const verifySuccess = await apiRequest('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: newOtp,
    });

    if (verifySuccess.status === 200 && verifySuccess.body.token && verifySuccess.body.user.isEmailVerified === true) {
      console.log('PASS: 8. Correct OTP verifies account, activates user, and returns JWT token');
    } else {
      throw new Error(`Test 8 Failed: Verification failed: ${verifySuccess.status}`);
    }

    // 7. Verify user can now log in normally
    const postVerifyLogin = await apiRequest('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });

    if (postVerifyLogin.status === 200 && postVerifyLogin.body.token) {
      console.log('PASS: 9. Activated user logs in successfully with email and password');
    } else {
      throw new Error(`Test 9 Failed: Activated user login failed: ${postVerifyLogin.status}`);
    }

    // 8. Existing User Login without OTP re-verification (Requirement: Important)
    const existingTraveler = await apiRequest('/auth/login', 'POST', {
      email: 'traveler@travelease.com',
      password: 'Traveler@2026!',
    });

    if (existingTraveler.status === 200 && existingTraveler.body.token) {
      console.log('PASS: 10. Existing user (traveler@travelease.com) logs in directly without OTP re-verification');
    } else {
      throw new Error(`Test 10 Failed: Existing traveler login failed: ${existingTraveler.status}`);
    }

    // 9. Administrator Login without OTP (Requirement: Important)
    const adminLogin = await apiRequest('/auth/admin-login', 'POST', {
      email: 'admin@travelease.com',
      password: 'Admin@TravelEase2026!',
    });

    if (adminLogin.status === 200 && adminLogin.body.user.role === 'admin') {
      console.log('PASS: 11. Administrator logs in directly with full privileges and zero OTP gating');
    } else {
      throw new Error(`Test 11 Failed: Admin login failed: ${adminLogin.status}`);
    }

    // 10. Google OAuth Login without OTP (Requirement: Important)
    const googleToken = jwt.sign(
      {
        email: `google.user.${timestamp}@gmail.com`,
        name: 'Google Verified User',
        picture: 'https://example.com/avatar.jpg',
        sub: `google_sub_${timestamp}`,
      },
      'test_secret'
    );

    const googleRes = await apiRequest('/auth/google', 'POST', {
      role: 'user',
      credential: googleToken,
    });

    if (googleRes.status === 200 && googleRes.body.token && googleRes.body.user.isEmailVerified === true) {
      console.log('PASS: 12. Google OAuth users log in directly without OTP (pre-verified by Google)');
    } else {
      throw new Error(`Test 12 Failed: Google auth failed: ${googleRes.status}`);
    }

    console.log('\n================ ALL 12/12 AUTH & OTP TESTS PASSED ================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runOtpAndAuthTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  });

