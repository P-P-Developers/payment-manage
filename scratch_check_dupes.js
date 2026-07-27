const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const paymentSchema = new mongoose.Schema({}, { strict: false });
  const Payment = mongoose.model('Payment', paymentSchema, 'payments');
  
  const panelSchema = new mongoose.Schema({}, { strict: false });
  const Panel = mongoose.model('Panel', panelSchema, 'panels');

  const payments = await Payment.find({ paymentType: 'Maintenance', billAmount: { $gt: 0 } }).lean();
  
  const map = {};
  payments.forEach(p => {
    const d = new Date(p.timestamp || p.createdAt);
    if (isNaN(d.getTime())) return;
    const key = p.panelId + '_' + d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0');
    if (!map[key]) map[key] = { count: 0, docs: [] };
    map[key].count++;
    map[key].docs.push({ id: p._id, date: d, amount: p.billAmount, remark: p.remark });
  });

  const duplicates = [];
  for (const [key, val] of Object.entries(map)) {
    if (val.count > 1) {
      const [panelId, month] = key.split('_');
      const panel = await Panel.findById(panelId).lean();
      duplicates.push({
        panelName: panel ? panel.panelName : panelId,
        month,
        count: val.count,
        details: val.docs
      });
    }
  }

  if (duplicates.length > 0) {
    console.log(JSON.stringify(duplicates, null, 2));
  } else {
    console.log('No duplicate maintenance bills found for the same month.');
  }

  process.exit(0);
}
check();
