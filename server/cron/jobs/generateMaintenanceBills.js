const Panel = require('../../models/Panel');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Log = require('../../models/Log');

/**
 * Job: Generate Maintenance Bills
 * Frequency: Every month on the 1st day at midnight (0 0 1 * *)
 * Description: Automatically generates a maintenance bill for each panel with positive maintenance charges.
 */
module.exports = {
  name: 'Generate Maintenance Bills',
  schedule: '0 0 1 * *', // Runs at 00:00 (midnight) on the 1st day of every month
  run: async () => {
    console.log(`[Cron Job] [${new Date().toISOString()}] Starting monthly maintenance bills generation...`);

    // 1. Find an Admin user to assign as the creator of the bills
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.error('[Cron Job] ERROR: No Admin user found. Background billing requires at least one Admin user for references.');
      return { success: false, error: 'No Admin user found' };
    }

    // 2. Query all panels
    const panels = await Panel.find({});
    if (panels.length === 0) {
      console.log('[Cron Job] No panels found. Job complete.');
      return { success: true, billedCount: 0, skippedCount: 0 };
    }

    // 3. Define the time range for the current month to avoid duplicate billing (idempotency check)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const remark = `Monthly maintenance charges for ${monthName} ${year}`;

    let billedCount = 0;
    let skippedCount = 0;

    // 4. Iterate over panels and generate bills
    for (const panel of panels) {
      // Skip if the panel has no maintenance charges set
      if (!panel.maintenanceCharges || panel.maintenanceCharges <= 0) {
        console.log(`[Cron Job] Panel ${panel.panelName} has no maintenance charges set. Skipping.`);
        skippedCount++;
        continue;
      }

      try {
        // Idempotency: Check if a maintenance bill has already been generated for this panel this month
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
          console.log(`[Cron Job] Panel ${panel.panelName} has already been billed for ${monthName} ${year}. Skipping.`);
          skippedCount++;
          continue;
        }

        // Create the maintenance bill Payment document
        await Payment.create({
          panelId: panel._id,
          paymentType: 'Maintenance',
          amountReceived: 0,
          paymentMode: 'UPI', // Default required mode to satisfy schema validation
          bankName: '',
          quantity: 1,
          unitPrice: panel.maintenanceCharges,
          billAmount: panel.maintenanceCharges,
          remark: remark,
          addedBy: admin._id,
          timestamp: now
        });

        // Automatically apply any existing credit balance to this new bill
        const { applyCreditToUnpaidBills } = require('../../utils/creditHelper');
        await applyCreditToUnpaidBills(panel._id);

        // Add a system log entry for audit trail
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `[System Cron] Generated maintenance bill of ₹${panel.maintenanceCharges} for panel "${panel.panelName}" for ${monthName} ${year}.`,
        });

        console.log(`[Cron Job] Billed ₹${panel.maintenanceCharges} to panel ${panel.panelName}`);
        billedCount++;
      } catch (error) {
        console.error(`[Cron Job] Failed to generate bill for panel ${panel.panelName}: ${error.message}`);
      }
    }

    console.log(`[Cron Job] Completed maintenance bills generation. Billed: ${billedCount}, Skipped: ${skippedCount}`);
    return { success: true, billedCount, skippedCount };
  }
};
