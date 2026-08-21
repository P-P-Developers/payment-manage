const cron = require('node-cron');

// Import your background job functions directly
const databaseBackup = require('./jobs/databaseBackup');
const generateMaintenanceBills = require('./jobs/generateMaintenanceBills');
const syncExternalBilling = require('./jobs/syncExternalBilling');
const cleanupBackups = require('./jobs/cleanupBackups');

module.exports = {
  init: () => {
    // 1. Database Backup - 11:45 PM and 7:00 AM
    cron.schedule('45 23 * * *', () => {
      databaseBackup()
    });
    cron.schedule('0 7 * * *', () => {
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

    // 4. Cleanup Old Backups - Every day at 7:30 AM
    cron.schedule('30 7 * * *', () => {
      if (typeof cleanupBackups.run === 'function') cleanupBackups.run();
    });

  }
};
