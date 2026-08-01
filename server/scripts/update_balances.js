const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Panel = require('../models/Panel');

dotenv.config({ path: '.env' }); // or just dotenv.config() since it's run from server dir

async function run() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const rawData = fs.readFileSync('e:\\payment-manage\\backups\\backup_2026-07-04\\panels.json', 'utf8');
    const panels = JSON.parse(rawData);

    let count = 0;
    for (const panelData of panels) {
      if (panelData.panelName) {
        const result = await Panel.updateOne(
          { panelName: panelData.panelName },
          { $set: { openingBalance: panelData.openingBalance || 0 } }
        );
        if (result.modifiedCount > 0) {
          console.log(`Updated ${panelData.panelName} to balance ${panelData.openingBalance}`);
        }
        count++;
      }
    }

    console.log(`Processed ${count} panels.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('DB connection closed');
  }
}

run();
