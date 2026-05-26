const axios = require("axios");
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Log = require('../models/Log');

const LicennseUpdate = async () => {
    try {
        console.log('Connecting to database...');
        const dbUri = process.env.MONGO_URI;
        const dbName = process.env.DB_NAME;

        await mongoose.connect(dbUri, { dbName });
        console.log('✅ Connected to MongoDB successfully.');

        // 1. Find Admin user
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            throw new Error('No Admin user found. Backend billing requires at least one Admin user for reference.');
        }

        // 2. Fetch external licenses
        const algoUrl = "https://newpenal.deepmindinfotech.com/backend/getall/history"

        // Get today's date for start and end date
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // const payload = {
        //     "page": 1,
        //     "limit": 1000,
        //     "search": "",
        //     "startDate": dateString,
        //     "endDate": dateString,
        //     "month": "",
        //     "licAdd": true
        // };


        const payload = {
            "page": 1,
            "limit": 10,
            "search": "",
            "startDate": "2026-05-25",
            "endDate": "2026-05-25",
            "month": "",
            "licAdd": true
        }

        console.log(`Fetching licenses from ${algoUrl} for date ${dateString}...`);
        const response = await axios.post(algoUrl, payload);

        if (response.data.status == true) {
            let LicenseData = response.data.data;

            // Map results to { panal_name, license: count }
            let result = LicenseData.map((item) => {
                let number = item.msg.match(/\d+/)?.[0];
                return {
                    panal_name: item.panal_name,
                    license: Number(number) || 0
                };
            });

            console.log(`Fetched ${result.length} license records from remote.`);

            // Loop through results
            for (const item of result) {
                if (item.license <= 0) continue;

                // Find matching panel in local DB by name (case-insensitive)
                const panel = await Panel.findOne({ panelName: new RegExp(`^${item.panal_name}$`, 'i') });

                if (panel) {
                    const quantity = item.license;
                    // Ensure licenseCharges is set, fallback to 1000 if not available
                    const unitPrice = panel.licenseCharges || 1000;
                    const billAmount = quantity * unitPrice;

                    // Create payment bill
                    const payment = await Payment.create({
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
                        details: `Generated license bill of ₹${billAmount} for panel "${panel.panelName}" for ${quantity} licenses.`,
                        timestamp: new Date()
                    });
                    console.log(`✅ Billed panel "${panel.panelName}" for ${quantity} licenses (₹${billAmount}).`);

                } else {
                    console.log(`⚠️ Panel "${item.panal_name}" not found in local DB. Skipping.`);
                }
            }
        } else {
            console.log('Failed to fetch data from remote API or status is false.');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);

    } catch (error) {
        console.error('🚫 Error during sync:', error);
        try {
            await mongoose.disconnect();
        } catch (e) { }
        process.exit(1);
    }
};

LicennseUpdate();

// const IpUpdate = async () => {
//     try {
//         console.log('Connecting to database...');
//         const dbUri = process.env.MONGO_URI;
//         const dbName = process.env.DB_NAME;

//         await mongoose.connect(dbUri, { dbName });
//         console.log('✅ Connected to MongoDB successfully.');

//         // 1. Find Admin user
//         const admin = await User.findOne({ role: 'Admin' });
//         if (!admin) {
//             throw new Error('No Admin user found. Backend billing requires at least one Admin user for reference.');
//         }

//         // 2. Fetch external IP charges
//         const algoUrl = "https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary-today"

//         console.log(`Fetching IP billing summary from ${algoUrl}...`);
//         const response = await axios.get(algoUrl);

//         if (response.data.success == true) {
//             let IpData = response.data.data;
//             let result = IpData;

//             console.log(`Fetched ${result.length} IP records from remote.`);

//             // Loop through results
//             for (const item of result) {
//                 if (item.count <= 0) continue;

//                 // Find matching panel in local DB by name (case-insensitive)
//                 const panel = await Panel.findOne({ panelName: new RegExp(`^${item.panel_name}$`, 'i') });

//                 if (panel) {
//                     const quantity = item.count;

//                     // Ensure ipCharges is set, fallback to 1 if not available
//                     const unitPrice = panel.ipCharges || 1;
//                     const billAmount = quantity * unitPrice;

//                     // Create payment bill
//                     const payment = await Payment.create({
//                         panelId: panel._id,
//                         paymentType: 'IP Charges',
//                         amountReceived: 0,
//                         paymentMode: 'UPI',
//                         bankName: '',
//                         quantity: quantity,
//                         unitPrice: unitPrice,
//                         billAmount: billAmount,
//                         billDiscount: 0,
//                         paymentDiscount: 0,
//                         remark: `Synced ${quantity} IP charges from iphub`,
//                         addedBy: admin._id,
//                         timestamp: new Date(item.createdAt)
//                     });

//                     await Log.create({
//                         userId: admin._id,
//                         actionType: 'ADD',
//                         module: 'Payment',
//                         details: `Generated IP charges bill of ₹${billAmount} for panel "${panel.panelName}" for ${quantity} IPs.`,
//                         timestamp: new Date()
//                     });
//                     console.log(`✅ Billed panel "${panel.panelName}" for ${quantity} IPs (₹${billAmount}).`);

//                 } else {
//                     console.log(`⚠️ Panel "${item.panel_name}" not found in local DB. Skipping.`);
//                 }
//             }
//         } else {
//             console.log('Failed to fetch data from remote API or status is false.');
//         }

//         await mongoose.disconnect();
//         console.log('Disconnected from MongoDB.');
//         process.exit(0);

//     } catch (error) {
//         console.error('🚫 Error during sync:', error);
//         try {
//             await mongoose.disconnect();
//         } catch (e) { }
//         process.exit(1);
//     }
// };

// IpUpdate();