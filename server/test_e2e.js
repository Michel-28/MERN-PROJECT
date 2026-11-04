process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const request = require('http');
require('dotenv').config({ path: __dirname + '/.env' });
process.env.NODE_ENV = 'test';
const app = require('./src/app');

// Supertest-like lightweight HTTP runner using node http
const runTests = async () => {
  console.log('\n=================== RUNNING TRAVELEASE E2E AUTOMATED TESTS ===================\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB for testing\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const apiRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + path);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = request.request(
        url,
        { method, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: JSON.parse(data) });
            } catch {
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

  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.error(`FAIL: ${name}`);
      failed++;
    }
  };

  try {
    // Test 1: User Registration
    const testUserEmail = `traveler.test.${Date.now()}@example.com`;
    const regRes = await apiRequest('/auth/register', 'POST', {
      name: 'Automated Test Traveler',
      email: testUserEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      phone: '+91 9988776655',
      role: 'admin', // Attack attempt: should be ignored and set to 'user'
    });
    process.env.NODE_ENV = 'test';
    assert(regRes.status === 201 && regRes.body.requiresOtp, '1. User can register with valid fields');
    assert(regRes.body.user.role === 'user', '2. Public registration cannot escalate role to admin');

    // Verify OTP to activate account and acquire JWT token
    const otpVerifyRes = await apiRequest('/auth/verify-otp', 'POST', {
      email: testUserEmail,
      otp: regRes.body.testOtp,
    });
    assert(otpVerifyRes.status === 200 && otpVerifyRes.body.token, '1b. OTP verification activates account and issues JWT token');

    const userToken = otpVerifyRes.body.token;
    const userId = otpVerifyRes.body.user.id;

    // Test 3: Duplicate Email Registration Rejection
    const dupRes = await apiRequest('/auth/register', 'POST', {
      name: 'Duplicate',
      email: testUserEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    assert(dupRes.status === 400 && dupRes.body.success === false, '3. Duplicate email registration is rejected');

    // Test 4: Password Hashing Verification
    const User = require('./src/models/User');
    const dbUser = await User.findById(userId).select('+password');
    assert(dbUser.password && !dbUser.password.includes('Password@123') && dbUser.password.startsWith('$2'), '4. Passwords are saved hashed with bcrypt');

    // Test 5: Valid User Login
    const loginRes = await apiRequest('/auth/login', 'POST', {
      email: testUserEmail,
      password: 'Password@123',
    });
    assert(loginRes.status === 200 && loginRes.body.token, '5. Valid user can log in');

    // Test 6: Invalid Credentials Rejection
    const badLogin = await apiRequest('/auth/login', 'POST', {
      email: testUserEmail,
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401 && badLogin.body.success === false, '6. Invalid credentials rejected');

    // Test 7: Normal User Cannot Access Admin Endpoints
    const adminAccessAsUser = await apiRequest('/admin/dashboard/stats', 'GET', null, userToken);
    assert(adminAccessAsUser.status === 403, '7. Normal user cannot access administrator APIs (403 Forbidden)');

    // Test 8: Unauthenticated Access Denied
    const unauthAccess = await apiRequest('/bookings', 'GET');
    assert(unauthAccess.status === 401, '8. Unauthenticated requests to protected endpoints return 401');

    // Test 9: Admin Login
    const adminLoginRes = await apiRequest('/auth/admin-login', 'POST', {
      email: 'admin@travelease.com',
      password: 'Admin@TravelEase2026!',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.user.role === 'admin', '9. Admin can log in with administrator credentials');
    const adminToken = adminLoginRes.body.token;

    // Test 10: Admin Access to Stats & User Directory
    const adminStats = await apiRequest('/admin/dashboard/stats', 'GET', null, adminToken);
    assert(adminStats.status === 200 && adminStats.body.stats.totalDestinations > 0, '10. Administrator can view platform stats');

    const adminUsers = await apiRequest('/admin/users', 'GET', null, adminToken);
    assert(adminUsers.status === 200 && adminUsers.body.data.length > 0, '11. Administrator can view registered users');

    // Test 12: Package selection and Booking Creation
    const TourPackage = require('./src/models/TourPackage');
    const samplePackage = await TourPackage.findOne();
    assert(samplePackage, 'Tour package exists in inventory');

    const bookingRes = await apiRequest('/bookings', 'POST', {
      packageId: samplePackage._id.toString(),
      departureDate: '2026-11-20',
      travelerCount: 2,
      contactPhone: '+91 98765 00000',
    }, userToken);
    assert(bookingRes.status === 201 && bookingRes.body.data.status === 'Pending Payment', '12. Booking created with Pending Payment status');
    const testBooking = bookingRes.body.data;

    // Test 13: Server Calculates Correct Price Authoritatively
    const expectedTotal = samplePackage.pricePerTraveler * 2;
    assert(testBooking.totalAmount === expectedTotal, `13. Server accurately computes amount (₹${expectedTotal})`);

    // Test 14: Payment Order Creation
    const orderRes = await apiRequest('/payments/create-order', 'POST', {
      bookingId: testBooking._id,
    }, userToken);
    assert(orderRes.status === 200 && orderRes.body.orderId, '14. Payment order successfully created');
    const orderData = orderRes.body;

    // Test 15: Payment Verification
    const testPayId = `pay_test_${Date.now()}`;
    const verifyRes = await apiRequest('/payments/verify', 'POST', {
      bookingId: testBooking._id,
      orderId: orderData.orderId,
      paymentId: testPayId,
      signature: 'test_signature_verified',
      paymentMethod: 'UPI',
    }, userToken);
    assert(verifyRes.status === 200 && verifyRes.body.booking.status === 'Confirmed', '15. Verified payment transitions booking to Confirmed and Paid');

    // Test 16: Idempotent Payment Callbacks (duplicate call doesn't create duplicate bookings)
    const dupVerify = await apiRequest('/payments/verify', 'POST', {
      bookingId: testBooking._id,
      orderId: orderData.orderId,
      paymentId: testPayId,
      signature: 'test_signature_verified',
    }, userToken);
    assert(dupVerify.status === 200 && dupVerify.body.booking.status === 'Confirmed', '16. Idempotent payment verification');

    // Test 17: User Cannot View Other User's Booking by ID
    const secondEmail = `second.${Date.now()}@example.com`;
    const secondUserReg = await apiRequest('/auth/register', 'POST', {
      name: 'Second User',
      email: secondEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    });
    const secondUserVerify = await apiRequest('/auth/verify-otp', 'POST', {
      email: secondEmail,
      otp: secondUserReg.body.testOtp,
    });
    const secondUserToken = secondUserVerify.body.token;

    const crossUserAccess = await apiRequest(`/bookings/${testBooking._id}`, 'GET', null, secondUserToken);
    assert(crossUserAccess.status === 403, '17. User cannot view another user\'s private booking (403 Forbidden)');

    // Test 18: Receipt Retrieval for Authorized User
    const receiptRes = await apiRequest(`/payments/receipt/${testBooking._id}`, 'GET', null, userToken);
    assert(receiptRes.status === 200 && receiptRes.body.data.priceBreakdown.totalPaid === expectedTotal, '18. Downloadable receipt generated for verified paid booking');

    // Test 19: Booking Cancellation and Refund Evaluation
    const cancelRes = await apiRequest(`/bookings/${testBooking._id}/cancel`, 'PATCH', {
      reason: 'Testing cancellation workflow',
    }, userToken);
    assert(cancelRes.status === 200 && cancelRes.body.data.status === 'Cancelled', '19. Booking cancelled and test refund evaluated');

    // Test 20: Admin Filter & Booking Details Inspection
    const adminBookingInspect = await apiRequest(`/admin/bookings/${testBooking._id}`, 'GET', null, adminToken);
    assert(adminBookingInspect.status === 200 && adminBookingInspect.body.data.cancellation, '20. Administrator can inspect full booking and cancellation history');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n=================== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
