const axios = require("axios");
const Panel = require('../../models/Panel');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Log = require('../../models/Log');

/**
 * Job: Sync External Billing (Licenses and IP Charges)
 * Frequency: Every day at 7:00 PM (0 19 * * *)
 * Description: Automatically fetches License and IP billing records from external APIs and generates bills.
 */
module.exports = {
    name: 'Sync External Billing (Licenses & IP Charges)',
    schedule: '0 19 * * *', // Runs at 19:00 (7:00 PM) every day
    run: async () => {
        console.log(`[Cron Job] [${new Date().toISOString()}] Starting external billing sync...`);

        // 1. Find Admin user
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            console.error('[Cron Job] ERROR: No Admin user found. Backend billing requires at least one Admin user for reference.');
            return { success: false, error: 'No Admin user found' };
        }

        let licenseBilled = 0;
        let ipBilled = 0;

        // ==============================================================
        // 2. Fetch external licenses (LicennseUpdate)
        // ==============================================================
        try {
            const algoUrl = "https://newpenal.deepmindinfotech.com/backend/getall/history";
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];

            const payload = {
                "page": 1,
                "limit": 1000,
                "search": "",
                "startDate": dateString,
                "endDate": dateString,
                "month": "",
                "licAdd": true
            };

            console.log(`[Cron Job] Fetching licenses from ${algoUrl} for date ${dateString}...`);
            const licenseResponse = await axios.post(algoUrl, payload);

            if (licenseResponse.data.status == true) {
                let LicenseData = licenseResponse.data.data;
                let result = LicenseData.map((item) => {
                    let number = item.msg.match(/\d+/)?.[0];
                    return {
                        panal_name: item.panal_name,
                        license: Number(number) || 0,
                        createdAt: item.createdAt
                    };
                });


                for (const item of result) {
                    if (item.license <= 0) continue;
                    const panel = await Panel.findOne({ panelName: new RegExp(`^${item.panal_name}$`, 'i') });

                    if (panel) {
                        const quantity = item.license;
                        const unitPrice = panel.licenseCharges || 1000;
                        const billAmount = quantity * unitPrice;

                        await Payment.create({
                            panelId: panel._id,
                            paymentType: 'License',
                            amountReceived: 0,
                            paymentMode: 'UPI',
                            bankName: '',
                            quantity: quantity,
                            unitPrice: unitPrice,
                            billAmount: billAmount,
                            billDiscount: 0,
                            paymentDiscount: 0,
                            remark: `Synced ${quantity} licenses from smartalgo`,
                            addedBy: admin._id,
                            timestamp: new Date(item.createdAt)
                        });

                        await Log.create({
                            userId: admin._id,
                            actionType: 'ADD',
                            module: 'Payment',
                            details: `[System Cron] Generated license bill of ₹${billAmount} for panel "${panel.panelName}" for ${quantity} licenses.`,
                        });
                        console.log(`[Cron Job] ✅ Billed panel "${panel.panelName}" for ${quantity} licenses (₹${billAmount}).`);
                        licenseBilled++;
                    } else {
                        console.log(`[Cron Job] ⚠️ Panel "${item.panal_name}" not found in local DB. Skipping.`);

                    }
                }
            } else {
                console.log('[Cron Job] Failed to fetch license data from remote API or status is false.');
            }
        } catch (error) {
            console.error('[Cron Job] 🚫 Error during license sync:', error.message);
        }

        // ==============================================================
        // 3. Fetch external IP charges (IpUpdate)
        // ==============================================================
        try {
            const ipUrl = "https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary-today";

            console.log(`[Cron Job] Fetching IP billing summary from ${ipUrl}...`);
            const ipResponse = await axios.get(ipUrl);

            if (ipResponse.data.success == true) {
                let IpData = ipResponse.data.data;
                let result = IpData;

                console.log(`[Cron Job] Fetched ${result.length} IP records from remote.`);

                for (const item of result) {
                    if (item.count <= 0) continue;
                    const panel = await Panel.findOne({ panelName: new RegExp(`^${item.panel_name}$`, 'i') });

                    if (panel) {
                        const quantity = item.count;
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
                            remark: `Synced ${quantity} IP charges from iphub`,
                            addedBy: admin._id,
                            timestamp: new Date(item.createdAt || new Date())
                        });

                        await Log.create({
                            userId: admin._id,
                            actionType: 'ADD',
                            module: 'Payment',
                            details: `[System Cron] Generated IP charges bill of ₹${billAmount} for panel "${panel.panelName}" for ${quantity} IPs.`,
                        });
                        console.log(`[Cron Job] ✅ Billed panel "${panel.panelName}" for ${quantity} IPs (₹${billAmount}).`);
                        ipBilled++;
                    } else {
                        console.log(`[Cron Job] ⚠️ Panel "${item.panel_name}" not found in local DB. Skipping.`);
                    }
                }
            } else {
                console.log('[Cron Job] Failed to fetch IP data from remote API or status is false.');
            }
        } catch (error) {
            console.error('[Cron Job] 🚫 Error during IP sync:', error.message);
        }

        console.log(`[Cron Job] Completed external billing sync. Licenses Billed: ${licenseBilled}, IPs Billed: ${ipBilled}`);
        return { success: true, licenseBilled, ipBilled };
    }
};
