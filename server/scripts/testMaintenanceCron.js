const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const generateMaintenanceBills = require('../cron/jobs/generateMaintenanceBills');

const runTest = async () => {
  try {
    console.log('--------------------------------------------------');
    console.log('         CRON MANUAL RUN / TEST TRIGGER           ');
    console.log('--------------------------------------------------');
    console.log('Connecting to database...');
    
    const dbUri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;
    
    if (!dbUri || !dbName) {
      throw new Error('MONGO_URI or DB_NAME is missing in your .env file.');
    }
    
    await mongoose.connect(dbUri, { dbName });
    console.log('✅ Connected to MongoDB successfully.');

    // Execute the job
    console.log('\nExecuting generating maintenance bills job...\n');
    const result = await generateMaintenanceBills.run();

    console.log('\n--------------------------------------------------');
    console.log('Execution Summary:');
    console.log(`Success: ${result.success}`);
    if (result.success) {
      console.log(`Panels Billed: ${result.billedCount}`);
      console.log(`Panels Skipped: ${result.skippedCount}`);
    } else {
      console.log(`Error: ${result.error}`);
    }
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('\n🚫 Test execution failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
};

runTest();
