const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');

dotenv.config();

const run = async () => {
  await connectDB();
  const payments = await Payment.find({}).populate('panelId', 'panelName').lean();
  console.log('--- ALL PAYMENTS IN DATABASE ---');
  payments.forEach((p, idx) => {
    console.log(`[${idx + 1}] Panel: ${p.panelId?.panelName || 'Deleted'}, Type: ${p.paymentType}, Amt Received: ${p.amountReceived}, Bill Amt: ${p.billAmount}, Mode: ${p.paymentMode}, Bank: ${p.bankName}, Status: ${p.status}, Remark: ${p.remark}`);
  });
  console.log('--- END OF PAYMENTS ---');
  mongoose.connection.close();
};

run();
