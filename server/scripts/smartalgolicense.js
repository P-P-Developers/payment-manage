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
        //     "limit": 10000,
        //     "search": "",
        //     // "startDate": dateString,
        //     // "endDate": dateString,
        //     "month": "",
        //     "licAdd": true
        // };


        const payload = {
            "page": 1,
            "limit": 10000,
            "search": "",
            "startDate": "2026-04-01",
            "endDate": "2027-05-25",
            "month": "",
            "licAdd": true
        }

        console.log(`Fetching licenses from ${algoUrl} for date ${dateString}...`);
        const response = await axios.post(algoUrl, payload);

        console.log("response", response?.data?.data);
        console.log("response Count", response?.data?.data?.length);




        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);

    } catch (error) {
        try {
            await mongoose.disconnect();
        } catch (e) { }
        process.exit(1);
    }
};


const IpUpdate = async () => {
    try {
        console.log('Connecting to database...');




        // 2. Fetch external IP charges
        const algoUrl = "https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary?limit=2000"

        console.log(`Fetching IP billing summary from ${algoUrl}...`);
        const response = await axios.get(algoUrl);
        console.log("response", response?.data?.data);
        console.log("response Count", response?.data?.data?.length);




    } catch (error) {
        try {
            await mongoose.disconnect();
        } catch (e) { }
        process.exit(1);
    }
};



LicennseUpdate();
// IpUpdate();