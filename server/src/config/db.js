const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travelease';
    const conn = await mongoose.connect(mongoUri);
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
