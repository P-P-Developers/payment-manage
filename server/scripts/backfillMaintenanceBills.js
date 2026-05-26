const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Log = require('../models/Log');

// Target dates for which we want to apply maintenance
const targetDates = [
  new Date(2026, 3, 1), // April 1, 2026 (index 3 is April)
  new Date(2026, 4, 1), // May 1, 2026 (index 4 is May)
];

const runBackfill = async () => {
  try {
    console.log('--------------------------------------------------');
    console.log('      BACKFILL / CUSTOM DATE MAINTENANCE BILLING  ');
    console.log('--------------------------------------------------');
    console.log('Connecting to database...');
    
    const dbUri = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;
    
    if (!dbUri || !dbName) {
      throw new Error('MONGO_URI or DB_NAME is missing in your .env file.');
    }
    
    await mongoose.connect(dbUri, { dbName });
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Find Admin user
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      throw new Error('No Admin user found. Backend billing requires at least one Admin user for reference.');
    }
    console.log(`Using Admin user: ${admin.name} (${admin.email})`);

    // 2. Fetch all panels
    const panels = await Panel.find({});
    console.log(`Found ${panels.length} panels in database.`);

    for (const targetDate of targetDates) {
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const monthName = targetDate.toLocaleString('default', { month: 'long' });
      const displayDateStr = `${String(targetDate.getDate()).padStart(2, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${year}`;

      console.log(`\n>>> Processing maintenance bills for target date: ${displayDateStr} (${monthName} ${year})`);

      // Define bounds for that target month to prevent duplicate entries
      const startOfMonth = new Date(year, monthIndex, 1);
      const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      const remark = `Monthly maintenance charges for ${monthName} ${year}`;

      let billedCount = 0;
      let skippedCount = 0;

      for (const panel of panels) {
        // Skip panels with ₹0 maintenance
        if (!panel.maintenanceCharges || panel.maintenanceCharges <= 0) {
          skippedCount++;
          continue;
        }

        // Check if bill already exists in that specific target month
        const existingBill = await Payment.findOne({
          panelId: panel._id,
          paymentType: 'Maintenance',
          billAmount: { $gt: 0 },
          timestamp: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        });

        if (existingBill) {
          console.log(`  [-] Panel "${panel.panelName}" already billed for ${monthName} ${year}. Skipping.`);
          skippedCount++;
          continue;
        }

        // Create the maintenance bill for the target date
        await Payment.create({
          panelId: panel._id,
          paymentType: 'Maintenance',
          amountReceived: 0,
          paymentMode: 'UPI',
          bankName: '',
          quantity: 1,
          unitPrice: panel.maintenanceCharges,
          billAmount: panel.maintenanceCharges,
          remark: remark,
          addedBy: admin._id,
          timestamp: targetDate
        });

        // Log transaction in the activity logs
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `[Manual Backfill] Generated maintenance bill of ₹${panel.maintenanceCharges} for panel "${panel.panelName}" for ${monthName} ${year} (Target Date: ${displayDateStr}).`,
          timestamp: new Date()
        });

        console.log(`  [+] Billed ₹${panel.maintenanceCharges} to "${panel.panelName}" for date ${displayDateStr}`);
        billedCount++;
      }

      console.log(`Summary for ${displayDateStr}: Billed: ${billedCount}, Already Billed / Skipped: ${skippedCount}`);
    }

    console.log('\n--------------------------------------------------');
    console.log('✅ Backfill process completed successfully!');
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('\n🚫 Backfill failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
};

runBackfill();
