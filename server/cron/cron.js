const cron = require('node-cron');

// Import your background job functions directly
const databaseBackup = require('./jobs/databaseBackup');
const generateMaintenanceBills = require('./jobs/generateMaintenanceBills');
const syncExternalBilling = require('./jobs/syncExternalBilling');

module.exports = {
  init: () => {
    // 1. Database Backup 45 min of 11 PM
    cron.schedule('45 23 * * *', () => {

      databaseBackup()
    });

    // 2. Generate Maintenance Bills - 1st of every month at midnight
    cron.schedule('0 0 1 * *', () => {
      if (typeof generateMaintenanceBills.run === 'function') generateMaintenanceBills.run();
    });

    // 3. Sync External Billing - Every day at 7:00 PM
    cron.schedule('0 19 * * *', () => {
      if (typeof syncExternalBilling.run === 'function') syncExternalBilling.run();
    });

  }
};
