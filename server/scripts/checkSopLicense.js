require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');

const MONGO_URI = process.env.MONGO_URI;

async function checkSync() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const backupDir = 'e:/payment-manage/backups/backup_2026-07-04';
    
    // Read JSON backups
    const panelsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'panels.json'), 'utf8'));
    const sopPanelIds = new Set(
      panelsData
        .filter(p => p.category && p.category.toLowerCase() === 'sop')
        .map(p => p._id['$oid'])
    );
    
    const paymentsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'payments.json'), 'utf8'));
    
    // Get JSON SOP License Payments
    const jsonPayments = paymentsData.filter(p => 
      sopPanelIds.has(p.panelId['$oid']) && 
      p.paymentType && p.paymentType.toLowerCase() === 'license' && 
      p.billAmount > 0
    );
    
    const jsonPaymentsMap = new Map();
    jsonPayments.forEach(p => jsonPaymentsMap.set(p._id['$oid'], p));
    
    // Get DB SOP License Payments
    const sopPanelIdsArray = Array.from(sopPanelIds);
    const dbPayments = await Payment.find({
        panelId: { $in: sopPanelIdsArray },
        paymentType: { $regex: /^license$/i },
        billAmount: { $gt: 0 }
    }).lean();
    
    const dbPaymentsMap = new Map();
    dbPayments.forEach(p => dbPaymentsMap.set(p._id.toString(), p));
    
    console.log(`Total SOP License payments in JSON Backup: ${jsonPayments.length}`);
    console.log(`Total SOP License payments in Database: ${dbPayments.length}`);
    
    const missingInDb = [];
    const mismatched = [];
    
    for (const [id, jsonP] of jsonPaymentsMap.entries()) {
        const dbP = dbPaymentsMap.get(id);
        if (!dbP) {
            missingInDb.push(id);
        } else {
            // Check for mismatches (e.g. billAmount, amountReceived)
            let isMismatch = false;
            let diff = {};
            if (jsonP.billAmount !== dbP.billAmount) {
                isMismatch = true;
                diff.billAmount = { json: jsonP.billAmount, db: dbP.billAmount };
            }
            if (jsonP.amountReceived !== dbP.amountReceived) {
                isMismatch = true;
                diff.amountReceived = { json: jsonP.amountReceived, db: dbP.amountReceived };
            }
            if (isMismatch) {
                mismatched.push({ id, diff });
            }
        }
    }
    
    const missingInJson = [];
    for (const id of dbPaymentsMap.keys()) {
        if (!jsonPaymentsMap.has(id)) {
            missingInJson.push(id);
        }
    }
    
    console.log('\n--- REPORT ---');
    console.log(`Missing in DB (in JSON but not in DB): ${missingInDb.length}`);
    console.log(`Missing in JSON (in DB but not in JSON): ${missingInJson.length}`);
    console.log(`Mismatched records (diff values): ${mismatched.length}`);
    
    if (missingInDb.length > 0) {
        console.log('\nSample Missing in DB IDs:');
        console.log(missingInDb.slice(0, 5));
    }
    
    if (mismatched.length > 0) {
        console.log('\nSample Mismatched Records:');
        console.log(mismatched.slice(0, 5));
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

checkSync();
