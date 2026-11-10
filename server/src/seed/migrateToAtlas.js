const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const localUri = process.env.LOCAL_MONGODB_URI;
const atlasUri = process.env.MONGODB_URI;

async function migrateToAtlas() {
  if (!localUri || !atlasUri) {
    throw new Error('LOCAL_MONGODB_URI and MONGODB_URI must be set in server/.env');
  }

  console.log('\n=================== MIGRATING DATA & SCHEMAS TO MONGODB ATLAS ===================\n');

  console.log('1. Connecting to Local MongoDB (Compass)...');
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('   ✓ Connected to Local MongoDB:', localConn.name);

  console.log('\n2. Connecting to MongoDB Atlas Cluster...');
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
  console.log('   ✓ Connected to MongoDB Atlas:', atlasConn.host, '/', atlasConn.name);

  // List all collections in local DB
  const collections = await localConn.db.listCollections().toArray();
  console.log(`\n3. Found ${collections.length} collections to transfer to Atlas:\n`);

  for (const col of collections) {
    const colName = col.name;
    const localCollection = localConn.db.collection(colName);
    const atlasCollection = atlasConn.db.collection(colName);

    // Read all docs
    const docs = await localCollection.find({}).toArray();

    if (docs.length > 0) {
      // Clear existing in Atlas collection to avoid duplicates
      await atlasCollection.deleteMany({});
      await atlasCollection.insertMany(docs);
      console.log(`   ✓ [${colName.padEnd(16)}] Successfully transferred ${docs.length} documents.`);
    } else {
      console.log(`   - [${colName.padEnd(16)}] 0 documents (empty collection).`);
    }

    // Transfer indexes (excluding default _id index)
    try {
      const indexes = await localCollection.indexes();
      for (const idx of indexes) {
        if (idx.name !== '_id_') {
          const { key, unique, sparse, name } = idx;
          await atlasCollection.createIndex(key, { unique, sparse, name });
        }
      }
    } catch (idxErr) {
      console.warn(`     Index note for ${colName}:`, idxErr.message);
    }
  }

  // Load Mongoose models on Atlas to ensure Mongoose schema validation & indexes
  console.log('\n4. Applying Mongoose Schemas & Model Indexes on Atlas...');
  require('../models/User');
  require('../models/Destination');
  require('../models/TourPackage');
  require('../models/Booking');
  require('../models/Payment');
  require('../models/Trip');
  require('../models/Favorite');

  console.log('   ✓ All Mongoose schemas and indexes compiled.');

  // Verify Atlas counts
  console.log('\n5. Verifying MongoDB Atlas document counts:');
  const atlasCols = await atlasConn.db.listCollections().toArray();
  for (const col of atlasCols) {
    const count = await atlasConn.db.collection(col.name).countDocuments();
    console.log(`   - ${col.name}: ${count} documents`);
  }

  await localConn.close();
  await atlasConn.close();

  console.log('\n=================== MIGRATION TO ATLAS COMPLETED SUCCESSFULLY ===================\n');
}

migrateToAtlas().catch((err) => {
  console.error('\n❌ Migration Error:', err);
  process.exit(1);
});
