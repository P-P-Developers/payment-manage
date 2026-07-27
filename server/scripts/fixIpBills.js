const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
}

const paymentSchema = new mongoose.Schema({}, { strict: false });
const Payment = mongoose.model('Payment', paymentSchema, 'payments');

const panelSchema = new mongoose.Schema({}, { strict: false });
const Panel = mongoose.model('Panel', panelSchema, 'panels');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

const logSchema = new mongoose.Schema({}, { strict: false });
const Log = mongoose.model('Log', logSchema, 'logs');

async function fixBills() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            console.error('No Admin user found.');
            process.exit(1);
        }

        const reportPath = 'ip_billing_discrepancy_report.json';
        if (!fs.existsSync(reportPath)) {
            console.error('Report file not found. Please run checkMissingIpBills.js first.');
            process.exit(1);
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        console.log(`Found ${report.missingEntries.length} Missing Entries and ${report.countMismatches.length} Count Mismatches to fix.`);

        // 1. Fix Missing Entries (API has data, DB has none)
        for (const entry of report.missingEntries) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${entry.panelName}$`, 'i') });
            if (!panel) {
                console.log(`Panel ${entry.panelName} not found in DB, skipping.`);
                continue;
            }

            const quantity = entry.apiCount;
            const unitPrice = panel.ipCharges || 1;
            const billAmount = quantity * unitPrice;
            
            // Reconstruct date for the timestamp
            const dateObj = new Date(entry.date + 'T12:00:00Z');

            await Payment.create({
                panelId: panel._id,
                paymentType: 'IP Charges',
                amountReceived: 0,
                paymentMode: 'UPI',
                bankName: '',
                quantity: quantity,
                unitPrice: unitPrice,
                billAmount: billAmount,
                billDiscount: 0,
                paymentDiscount: 0,
                remark: `Auto-fixed: Synced ${quantity} missing IPs from iphub`,
                addedBy: admin._id,
                timestamp: dateObj,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`FIXED (Missing Entry): Added bill of ₹${billAmount} for panel ${entry.panelName} (${quantity} IPs on ${entry.date})`);
        }

        // 2. Fix Count Mismatches
        for (const mismatch of report.countMismatches) {
            const panel = await Panel.findOne({ panelName: new RegExp(`^${mismatch.panelName}$`, 'i') });
            if (!panel) continue;

            const diff = mismatch.difference;
            const dateStr = mismatch.date;
            
            // Search criteria for DB payments on that date
            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

            if (diff > 0) {
                // API has more than DB, we need to add the difference
                const quantity = diff;
                const unitPrice = panel.ipCharges || 1;
                const billAmount = quantity * unitPrice;

                await Payment.create({
                    panelId: panel._id,
                    paymentType: 'IP Charges',
                    amountReceived: 0,
                    paymentMode: 'UPI',
                    bankName: '',
                    quantity: quantity,
                    unitPrice: unitPrice,
                    billAmount: billAmount,
                    billDiscount: 0,
                    paymentDiscount: 0,
                    remark: `Auto-fixed: Added ${quantity} extra IPs to match API count`,
                    addedBy: admin._id,
                    timestamp: new Date(dateStr + 'T12:00:00Z'),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`FIXED (Mismatch +): Added extra ${quantity} IPs for ${mismatch.panelName} on ${dateStr}`);
                
            } else if (diff < 0) {
                // DB has more than API, we need to reduce
                const excess = Math.abs(diff);
                const unitPrice = panel.ipCharges || 1;

                // Find a payment to reduce
                const payments = await Payment.find({
                    panelId: panel._id,
                    paymentType: 'IP Charges',
                    timestamp: { $gte: startOfDay, $lte: endOfDay }
                }).sort({ createdAt: -1 });

                let remainingToReduce = excess;
                for (let p of payments) {
                    if (remainingToReduce <= 0) break;
                    
                    if (p.quantity > remainingToReduce) {
                        // Reduce this payment
                        const newQty = p.quantity - remainingToReduce;
                        await Payment.updateOne({ _id: p._id }, {
                            $set: {
                                quantity: newQty,
                                billAmount: newQty * unitPrice,
                                remark: (p.remark || '') + ` | Auto-fixed: reduced by ${remainingToReduce} to match API`
                            }
                        });
                        console.log(`FIXED (Mismatch -): Reduced quantity of existing bill for ${mismatch.panelName} on ${dateStr} by ${remainingToReduce}`);
                        remainingToReduce = 0;
                    } else {
                        // Delete this payment completely as it's less than or equal to excess
                        await Payment.deleteOne({ _id: p._id });
                        console.log(`FIXED (Mismatch -): Deleted an existing bill for ${mismatch.panelName} on ${dateStr} (quantity: ${p.quantity})`);
                        remainingToReduce -= p.quantity;
                    }
                }
            }
        }

        console.log('\nAll fixes applied successfully!');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

fixBills();
