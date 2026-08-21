const axios = require("axios");
const Panel = require('../../models/Panel');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Log = require('../../models/Log');
const Notification = require('../../models/Notification');

/**
 * Job: Sync External Billing (Licenses and IP Charges)
 * Frequency: Every day at 7:00 PM (0 19 * * *)
 * Description: Automatically fetches License and IP billing records from external APIs and generates bills.
 */
module.exports = {
    name: 'Sync External Billing (Licenses & IP Charges)',
    schedule: '0 19 * * *', // Runs at 19:00 (7:00 PM) every day
    run: async () => {


        // 1. Find Admin user
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {

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
                    const panel = await Panel.findOne({ panelName: item.panal_name, status: { $ne: 'Stopped' } });

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
                            isGstApplied: panel.takeSopDiscount || false,
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

                        licenseBilled++;
                    }
                }
            }
        } catch (error) {
            console.error("Algo Billing Sync Error:", error);
            await Notification.create({ message: `SmartAlgo License fetch error: ${error.message}`, type: 'error' });
        }

        // ==============================================================
        // 3. Fetch external IP charges (IpUpdate)
        // ==============================================================
        try {
            const ipUrl = "https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary-today";


            const ipResponse = await axios.get(ipUrl);
            if (ipResponse.data.success == true) {
                let IpData = ipResponse.data.data;
                let result = IpData;



                for (const item of result) {
                    if (item.count <= 0) continue;
                    const panel = await Panel.findOne({ panelName: item.panel_name, status: { $ne: 'Stopped' } });

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
                            remark: `Synced ${quantity} IP charges from iphub. Type: ${item.type || 'Unknown'}`,
                            addedBy: admin._id,
                            timestamp: new Date(item.createdAt || new Date())
                        });

                        await Log.create({
                            userId: admin._id,
                            actionType: 'ADD',
                            module: 'Payment',
                            details: `[System Cron] Generated IP charges bill of ₹${billAmount} for panel "${panel.panelName}" for ${quantity} IPs.`,
                        });

                        ipBilled++;
                    }
                }
            }
        } catch (error) {
            console.error("IP Billing Sync Error:", error);
            await Notification.create({ message: `IP Billing fetch error: ${error.message}`, type: 'error' });
        }

        // ==============================================================
        // 4. Fetch external SOP Licenses
        // ==============================================================
        let sopBilled = 0;
        try {
            const sopUrl = "https://soptools.tradestreet.in/superbackend/TodayAmountDetails";
            // Hit the API (no specific body is needed as per example, using empty object)
            const sopResponse = await axios.get(sopUrl);

            if (sopResponse.data.Status === true && sopResponse.data.AmmountDetails) {
                const sopData = sopResponse.data.AmmountDetails;
                // Fetch SOP panels
                const sopPanels = await Panel.find({ category: { $regex: new RegExp('^sop$', 'i') }, status: { $ne: 'Stopped' } });

                for (const item of sopData) {
                    const url = (item.Url || "").toLowerCase();
                    // Match panel from url using same logic as manual sync
                    const matchedPanel = sopPanels.find(p => p.panelName && url.includes(p.panelName.toLowerCase()));

                    if (matchedPanel) {
                        const amount = parseFloat(item.AmountDetails) || 0;
                        if (amount <= 0) continue;

                        let finalBillAmount = amount;
                        let gstAmount = 0;

                        if (matchedPanel.takeSopDiscount) {
                            gstAmount = amount * 0.18;
                            finalBillAmount = amount + gstAmount;
                        }

                        const unitPrice = matchedPanel.licenseCharges || amount;
                        const quantity = unitPrice > 0 ? Number((amount / unitPrice).toFixed(2)) : 1;

                        // Parse "DD/MM/YYYY HH:mm:ss"
                        let timestamp = new Date();
                        const dateStr = item["Payment Date"];
                        if (dateStr) {
                            const parts = dateStr.split(' ');
                            if (parts.length === 2) {
                                const dParts = parts[0].split('/');
                                if (dParts.length === 3) {
                                    timestamp = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${parts[1]}+05:30`);
                                }
                            }
                        }

                        // Basic check to prevent duplicate adding if cron runs twice in same minute for same amount
                        const existingPayment = await Payment.findOne({
                            panelId: matchedPanel._id,
                            paymentType: 'License',
                            timestamp: timestamp,
                            billAmount: finalBillAmount
                        });

                        if (!existingPayment) {
                            await Payment.create({
                                panelId: matchedPanel._id,
                                paymentType: 'License',
                                amountReceived: 0,
                                paymentMode: 'UPI',
                                bankName: '',
                                quantity: quantity,
                                unitPrice: unitPrice,
                                billAmount: finalBillAmount,
                                billDiscount: 0,
                                paymentDiscount: 0,
                                remark: `Auto-fixed: SOP Sync (${quantity} licenses). ${matchedPanel.takeSopDiscount ? `Amount: ₹${amount} + GST: ₹${gstAmount}` : ''}`.trim(),
                                addedBy: admin._id,
                                timestamp: timestamp,
                                isGstApplied: matchedPanel.takeSopDiscount || false
                            });

                            await Log.create({
                                userId: admin._id,
                                actionType: 'ADD',
                                module: 'Payment',
                                details: `[System Cron] Created SOP license bill of ₹${amount} for panel "${matchedPanel.panelName}"`
                            });

                            sopBilled++;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("SOP Billing Sync Error:", error);
            await Notification.create({ message: `SOP License fetch error: ${error.message}`, type: 'error' });
        }

        return { success: true, licenseBilled, ipBilled, sopBilled };
    }
};
