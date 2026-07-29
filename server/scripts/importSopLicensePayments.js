require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Payment = require('../models/Payment');

const MONGO_URI = process.env.MONGO_URI;

function restoreDoc(doc) {
  const newDoc = { ...doc };
  if (doc._id && doc._id.$oid) newDoc._id = doc._id.$oid;
  if (doc.panelId && doc.panelId.$oid) newDoc.panelId = doc.panelId.$oid;
  if (doc.addedBy && doc.addedBy.$oid) newDoc.addedBy = doc.addedBy.$oid;
  if (doc.timestamp && doc.timestamp.$date) newDoc.timestamp = new Date(doc.timestamp.$date);
  if (doc.createdAt && doc.createdAt.$date) newDoc.createdAt = new Date(doc.createdAt.$date);
  if (doc.updatedAt && doc.updatedAt.$date) newDoc.updatedAt = new Date(doc.updatedAt.$date);
  
  if (Array.isArray(doc.editHistory)) {
      newDoc.editHistory = doc.editHistory.map(h => {
          const nh = { ...h };
          if (h.editedBy && h.editedBy.$oid) nh.editedBy = h.editedBy.$oid;
          if (h.editedAt && h.editedAt.$date) nh.editedAt = new Date(h.editedAt.$date);
          return nh;
      });
  }
  if (Array.isArray(doc.appliedPayments)) {
      newDoc.appliedPayments = doc.appliedPayments.map(p => {
          const np = { ...p };
          if (p.paymentId && p.paymentId.$oid) np.paymentId = p.paymentId.$oid;
          if (p.appliedAt && p.appliedAt.$date) np.appliedAt = new Date(p.appliedAt.$date);
          return np;
      });
  }
  delete newDoc.__v;
  return newDoc;
}

async function importData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const backupDir = 'e:/payment-manage/backups/backup_2026-07-04';
    
    // Read and filter panels
    const panelsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'panels.json'), 'utf8'));
    const sopPanelIds = new Set(
      panelsData
        .filter(p => p.category && p.category.toLowerCase() === 'sop')
        .map(p => p._id['$oid'])
    );
    console.log(`Found ${sopPanelIds.size} SOP panels.`);

    // Read and filter payments
    const paymentsData = JSON.parse(fs.readFileSync(path.join(backupDir, 'payments.json'), 'utf8'));
    const filteredPayments = paymentsData.filter(p => 
      sopPanelIds.has(p.panelId['$oid']) && 
      p.paymentType && p.paymentType.toLowerCase() === 'license' && 
      p.billAmount > 0
    );
    
    console.log(`Found ${filteredPayments.length} payments to import.`);

    if (filteredPayments.length === 0) {
      console.log('No payments to insert. Exiting.');
      process.exit(0);
    }

    // Format for mongoose
    const formattedPayments = filteredPayments.map(restoreDoc);

    // Insert into DB
    // Use insertMany with ordered: false to prevent stopping on duplicate key errors if already imported
    const result = await Payment.insertMany(formattedPayments, { ordered: false }).catch(err => {
        if (err.code === 11000) {
            console.log('Some duplicate records were skipped.');
            return err.insertedDocs || [];
        }
        throw err;
    });

    console.log(`Successfully inserted ${result ? result.length : 0} payments.`);

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

importData();
