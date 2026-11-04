const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelease';

async function migrate() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for legacy booking migration');

  const collection = mongoose.connection.collection('bookings');
  const allBookings = await collection.find({}).toArray();
  console.log(`Found ${allBookings.length} booking records`);

  let updatedCount = 0;
  for (const b of allBookings) {
    const updates = {};
    if (!b.email) {
      updates.email = b.contactInfo?.email || 'guest@travelease.com';
    }
    if (!b.customerName) {
      updates.customerName =
        b.travelerDetails?.[0]?.name ||
        (updates.email || b.email || 'Guest').split('@')[0];
    }
    if (!b.contactPhone) {
      updates.contactPhone = b.contactInfo?.phone || '+91 98765 43210';
    }
    if (!b.departureDate) {
      updates.departureDate = b.packageSnapshot?.departureDate
        ? new Date(b.packageSnapshot.departureDate)
        : new Date(b.createdAt || Date.now());
    }
    if (!b.packageTitleSnapshot) {
      updates.packageTitleSnapshot = b.packageSnapshot?.title || 'Tour Package';
    }
    if (!b.destinationSnapshot) {
      updates.destinationSnapshot = b.packageSnapshot?.destinationName || 'India';
    }
    if (!b.status) {
      updates.status =
        b.bookingStatus === 'confirmed'
          ? 'Confirmed'
          : b.bookingStatus === 'cancelled'
          ? 'Cancelled'
          : 'Pending Payment';
    }
    if (!b.paymentStatus) {
      updates.paymentStatus = 'paid';
    }

    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ _id: b._id }, { $set: updates });
      console.log(`Updated legacy booking ${b.bookingReference || b._id}:`, Object.keys(updates));
      updatedCount++;
    }
  }

  console.log(`Migration finished. Updated ${updatedCount} bookings.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
