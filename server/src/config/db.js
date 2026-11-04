const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelease');
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);

    // Ensure all existing accounts and admins are verified so they continue logging in without OTP re-verification
    try {
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
    } catch (migErr) {
      console.warn('[DB Init Note]:', migErr.message);
    }
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
