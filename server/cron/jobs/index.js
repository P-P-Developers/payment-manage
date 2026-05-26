const generateMaintenanceBills = require('./generateMaintenanceBills');
const syncExternalBilling = require('./syncExternalBilling');

// Registry of all scheduled background jobs.
// To add a new cron job in the future:
// 1. Create a new job file in this directory (e.g. `sendBackupEmail.js`)
// 2. Export an object with { name, schedule, run } from that file
// 3. Require and add it to the exported array below:
module.exports = [
  generateMaintenanceBills,
  syncExternalBilling,
];
