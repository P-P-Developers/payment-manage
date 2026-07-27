const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── DB Connection ────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.DB_NAME;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file');
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

// ─── Main ─────────────────────────────────────────────────────────────
async function fixLicenseBills() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
        console.log('✅ Connected.');

        // ── 0. Load admin user ───────────────────────────────────────
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            console.error('❌ No Admin user found in DB.');
            process.exit(1);
        }

        // ── 1. Load discrepancy report ───────────────────────────────
        const reportPath = path.resolve(__dirname, 'license_discrepancy_report.json');
        if (!fs.existsSync(reportPath)) {
            console.error('❌ Report file not found. Please run checkMissingLicenseBills.js first.');
            process.exit(1);
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        console.log(`\nReport loaded (generated: ${report.generatedAt || 'unknown'})`);
        console.log(`  Missing Entries  : ${report.missingEntries.length}`);
        console.log(`  Count Mismatches : ${report.countMismatches.length}`);
        console.log(`  Panels Not Found : ${report.panelsNotFound.length} (skipped — no local panel exists)\n`);

        let fixedMissing    = 0;
        let fixedMismatch   = 0;
        let skipped         = 0;

        // ── 2. Fix Missing Entries ───────────────────────────────────
        console.log('--- Fixing Missing Entries ---');

        for (const entry of report.missingEntries) {
            const panel = await Panel.findOne({
                panelName: new RegExp(`^${escapeRegex(entry.panelName)}$`, 'i')
            });

            if (!panel) {
                console.log(`  ⚠️  SKIP: Panel "${entry.panelName}" not found in DB.`);
                skipped++;
                continue;
            }

            const quantity  = entry.apiCount;
            const unitPrice = panel.licenseCharges || 1000;   // fallback ₹1000/license
            const billAmount = quantity * unitPrice;

            const dateObj = new Date(entry.date + 'T12:00:00Z');

            await Payment.create({
                panelId        : panel._id,
                paymentType    : 'License',
                amountReceived : 0,
                paymentMode    : 'UPI',
                bankName       : '',
                quantity       : quantity,
                unitPrice      : unitPrice,
                billAmount     : billAmount,
                billDiscount   : 0,
                paymentDiscount: 0,
                remark         : `Auto-fixed: Added ${quantity} missing licenses from SmartAlgo (${entry.date})`,
                addedBy        : admin._id,
                timestamp      : dateObj,
                createdAt      : new Date(),
                updatedAt      : new Date()
            });

            await Log.create({
                userId     : admin._id,
                actionType : 'ADD',
                module     : 'Payment',
                details    : `Auto-fixed: Created license bill of ₹${billAmount} for panel "${panel.panelName}" — ${quantity} licenses on ${entry.date}`,
                timestamp  : new Date()
            });

            console.log(`  ✅ FIXED (Missing): Panel "${entry.panelName}" | Date: ${entry.date} | Qty: ${quantity} | Bill: ₹${billAmount}`);
            fixedMissing++;
        }

        // ── 3. Fix Count Mismatches ──────────────────────────────────
        console.log('\n--- Fixing Count Mismatches ---');

        for (const mismatch of report.countMismatches) {
            const panel = await Panel.findOne({
                panelName: new RegExp(`^${escapeRegex(mismatch.panelName)}$`, 'i')
            });

            if (!panel) {
                console.log(`  ⚠️  SKIP: Panel "${mismatch.panelName}" not found in DB.`);
                skipped++;
                continue;
            }

            const diff      = mismatch.difference;   // apiCount - dbQuantity
            const dateStr   = mismatch.date;
            const unitPrice = panel.licenseCharges || 1000;

            const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
            const endOfDay   = new Date(dateStr + 'T23:59:59.999Z');

            if (diff > 0) {
                // API has MORE than DB — add difference bill
                const quantity   = diff;
                const billAmount = quantity * unitPrice;

                await Payment.create({
                    panelId        : panel._id,
                    paymentType    : 'License',
                    amountReceived : 0,
                    paymentMode    : 'UPI',
                    bankName       : '',
                    quantity       : quantity,
                    unitPrice      : unitPrice,
                    billAmount     : billAmount,
                    billDiscount   : 0,
                    paymentDiscount: 0,
                    remark         : `Auto-fixed: Added ${quantity} extra licenses to match API count (${dateStr})`,
                    addedBy        : admin._id,
                    timestamp      : new Date(dateStr + 'T12:00:00Z'),
                    createdAt      : new Date(),
                    updatedAt      : new Date()
                });

                await Log.create({
                    userId     : admin._id,
                    actionType : 'ADD',
                    module     : 'Payment',
                    details    : `Auto-fixed: Added ${quantity} extra license qty for "${panel.panelName}" on ${dateStr} (mismatch correction)`,
                    timestamp  : new Date()
                });

                console.log(`  ✅ FIXED (Mismatch +): Panel "${mismatch.panelName}" | Date: ${dateStr} | Added Qty: ${quantity} | Bill: ₹${billAmount}`);
                fixedMismatch++;

            } else if (diff < 0) {
                // DB has MORE than API — reduce excess
                const excess = Math.abs(diff);

                const payments = await Payment.find({
                    panelId     : panel._id,
                    paymentType : 'License',
                    timestamp   : { $gte: startOfDay, $lte: endOfDay }
                }).sort({ createdAt: -1 });

                let remainingToReduce = excess;

                for (const pay of payments) {
                    if (remainingToReduce <= 0) break;

                    if (pay.quantity > remainingToReduce) {
                        const newQty = pay.quantity - remainingToReduce;
                        await Payment.updateOne({ _id: pay._id }, {
                            $set: {
                                quantity   : newQty,
                                billAmount : newQty * unitPrice,
                                remark     : (pay.remark || '') + ` | Auto-fixed: reduced by ${remainingToReduce} to match API`
                            }
                        });
                        console.log(`  ✅ FIXED (Mismatch -): Reduced qty of existing bill for "${mismatch.panelName}" on ${dateStr} by ${remainingToReduce}`);
                        remainingToReduce = 0;
                    } else {
                        await Payment.deleteOne({ _id: pay._id });
                        console.log(`  ✅ FIXED (Mismatch -): Deleted bill for "${mismatch.panelName}" on ${dateStr} (qty was ${pay.quantity})`);
                        remainingToReduce -= pay.quantity;
                    }
                }

                fixedMismatch++;
            } else {
                // diff === 0 — no action needed (shouldn't be in mismatch list)
                skipped++;
            }
        }

        // ── 4. Summary ───────────────────────────────────────────────
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║        FIX COMPLETE — SUMMARY        ║');
        console.log('╠══════════════════════════════════════╣');
        console.log(`║  Missing Entries Fixed  : ${String(fixedMissing).padEnd(10)}║`);
        console.log(`║  Mismatches Fixed       : ${String(fixedMismatch).padEnd(10)}║`);
        console.log(`║  Skipped (not in DB)    : ${String(skipped).padEnd(10)}║`);
        console.log('╚══════════════════════════════════════╝\n');

    } catch (err) {
        console.error('❌ Error:', err.message || err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Helper: escape special chars in panel name for regex
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

fixLicenseBills();
