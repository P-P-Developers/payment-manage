const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the parent server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Panel = require('../models/Panel');
const Payment = require('../models/Payment');
const Log = require('../models/Log');

const connectDB = async () => {
  try {
    const DB_URI = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;
    await mongoose.connect(DB_URI);
    console.log('MongoDB connected successfully for seeding.');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const bankNames = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'KOTAK Mahindra Bank'];
const paymentModes = ['UPI', 'Bank Transfer', 'Online'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedData = async () => {
  try {
    await connectDB();

    // 1. Find or create default Super Admin
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      admin = await User.findOne({});
    }
    if (!admin) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword', salt);
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@panel.com',
        password: hashedPassword,
        role: 'Admin',
        permissions: ['view_panels', 'add_payments', 'view_reports', 'edit_payments'],
      });
      console.log('Created default Super Admin user for seeding (admin@panel.com / adminpassword).');
    } else {
      console.log(`Using existing user: ${admin.name} (${admin.email}) as seeder.`);
    }

    const panelsData = [
      {
        panelName: "Apex Algo Systems",
        ownerName: "Rajesh Sharma",
        ownerEmail: "rajesh@apexalgo.in",
        phoneNumber: "9876543210",
        licenseCharges: 25000,
        ipCharges: 10000,
        maintenanceCharges: 5000,
        openingBalance: 15000
      },
      {
        panelName: "ProTrader Labs",
        ownerName: "Amit Patel",
        ownerEmail: "amit@protraderlabs.com",
        phoneNumber: "9812345678",
        licenseCharges: 30000,
        ipCharges: 12000,
        maintenanceCharges: 6000,
        openingBalance: 0
      },
      {
        panelName: "Bullish Matrix Solutions",
        ownerName: "Vikram Malhotra",
        ownerEmail: "vikram@bullishmatrix.in",
        phoneNumber: "9988776655",
        licenseCharges: 20000,
        ipCharges: 8000,
        maintenanceCharges: 4000,
        openingBalance: 25000
      },
      {
        panelName: "SmartWealth Algotech",
        ownerName: "Sanjay Mehta",
        ownerEmail: "sanjay@smartwealth.co.in",
        phoneNumber: "9871234560",
        licenseCharges: 28000,
        ipCharges: 15000,
        maintenanceCharges: 7500,
        openingBalance: 8000
      },
      {
        panelName: "Vanguard Trade Systems",
        ownerName: "Priya Nair",
        ownerEmail: "priya@vanguardtrade.in",
        phoneNumber: "9543210987",
        licenseCharges: 15000,
        ipCharges: 5000,
        maintenanceCharges: 3000,
        openingBalance: 0
      },
      {
        panelName: "Quantum Profit Labs",
        ownerName: "Rohan Gupta",
        ownerEmail: "rohan@quantumlabs.in",
        phoneNumber: "8123456789",
        licenseCharges: 35000,
        ipCharges: 18000,
        maintenanceCharges: 8000,
        openingBalance: 45000
      },
      {
        panelName: "Delta Invest Technologies",
        ownerName: "Neha Joshi",
        ownerEmail: "neha@deltainvest.com",
        phoneNumber: "9012345678",
        licenseCharges: 22000,
        ipCharges: 9000,
        maintenanceCharges: 4500,
        openingBalance: 12000
      },
      {
        panelName: "Zenith Algo Capital",
        ownerName: "Sandeep Singh",
        ownerEmail: "sandeep@zenithalgo.co.in",
        phoneNumber: "9321654987",
        licenseCharges: 27000,
        ipCharges: 11000,
        maintenanceCharges: 5500,
        openingBalance: 0
      },
      {
        panelName: "Alpha TradeTech",
        ownerName: "Manish Verma",
        ownerEmail: "manish@alphatradetech.in",
        phoneNumber: "9210987654",
        licenseCharges: 18000,
        ipCharges: 6000,
        maintenanceCharges: 3500,
        openingBalance: 5000
      },
      {
        panelName: "SpeedEdge Wealth",
        ownerName: "Divya Rao",
        ownerEmail: "divya@speededgewealth.com",
        phoneNumber: "8899001122",
        licenseCharges: 24000,
        ipCharges: 10000,
        maintenanceCharges: 5000,
        openingBalance: 20000
      }
    ];

    console.log('Cleaning up existing panels and associated records with matching names...');
    for (const pData of panelsData) {
      const existingPanel = await Panel.findOne({ panelName: pData.panelName });
      if (existingPanel) {
        await Payment.deleteMany({ panelId: existingPanel._id });
        await Panel.findByIdAndDelete(existingPanel._id);
      }
    }
    console.log('Cleanup completed successfully.');

    // Helper to get past dates
    const getPastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    console.log('Inserting 10 panels and their transaction histories...');

    for (let i = 0; i < panelsData.length; i++) {
      const pData = panelsData[i];
      
      // 1. Create Panel
      const panel = await Panel.create(pData);
      console.log(`[${i + 1}/10] Created panel: ${panel.panelName} (Owner: ${panel.ownerName})`);

      // Create activity log for Panel creation
      await Log.create({
        userId: admin._id,
        actionType: 'ADD',
        module: 'Panel',
        details: `Created new panel client: ${panel.panelName} (Owner: ${panel.ownerName}) with opening balance: ${panel.openingBalance}`,
        timestamp: getPastDate(75) // 75 days ago
      });

      // 2. Generate Transactions for each panel to make it feel super realistic

      // Month 1: License Bill (60 days ago)
      await Payment.create({
        panelId: panel._id,
        paymentType: 'License',
        amountReceived: 0,
        paymentMode: 'UPI',
        bankName: '',
        quantity: 1,
        unitPrice: panel.licenseCharges,
        billAmount: panel.licenseCharges,
        remark: 'Initial software license activation charges',
        addedBy: admin._id,
        timestamp: getPastDate(60)
      });
      await Log.create({
        userId: admin._id,
        actionType: 'ADD',
        module: 'Payment',
        details: `Generated bill of ₹${panel.licenseCharges} (License) for panel ${panel.panelName}`,
        timestamp: getPastDate(60)
      });

      // Month 1: License Payment Received (55 days ago)
      let licReceived = panel.licenseCharges;
      if (i === 3 || i === 6) licReceived = panel.licenseCharges - 5000; // Partial payment
      if (i === 5) licReceived = 0; // Did not pay Month 1 yet

      if (licReceived > 0) {
        const mode = getRandomElement(paymentModes);
        const bank = mode === 'Cash' ? '' : getRandomElement(bankNames);
        await Payment.create({
          panelId: panel._id,
          paymentType: 'License',
          amountReceived: licReceived,
          paymentMode: mode,
          bankName: bank,
          quantity: 0,
          unitPrice: 0,
          billAmount: 0,
          remark: licReceived === panel.licenseCharges ? 'Received license activation fee' : 'Received partial license activation fee',
          addedBy: admin._id,
          timestamp: getPastDate(55)
        });
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `Received payment of ₹${licReceived} (License) from panel ${panel.panelName} via ${mode}`,
          timestamp: getPastDate(55)
        });
      }

      // Month 1: IP Charges Bill (45 days ago)
      await Payment.create({
        panelId: panel._id,
        paymentType: 'IP Charges',
        amountReceived: 0,
        paymentMode: 'UPI',
        bankName: '',
        quantity: 1,
        unitPrice: panel.ipCharges,
        billAmount: panel.ipCharges,
        remark: 'API bridge IP server setup charges',
        addedBy: admin._id,
        timestamp: getPastDate(45)
      });
      await Log.create({
        userId: admin._id,
        actionType: 'ADD',
        module: 'Payment',
        details: `Generated bill of ₹${panel.ipCharges} (IP Charges) for panel ${panel.panelName}`,
        timestamp: getPastDate(45)
      });

      // Month 1: IP Charges Payment Received (40 days ago)
      let ipReceived = panel.ipCharges;
      if (i === 2 || i === 9) ipReceived = 0; // Unpaid IP charges to show outstanding variety
      
      if (ipReceived > 0) {
        const mode = getRandomElement(paymentModes);
        const bank = mode === 'Cash' ? '' : getRandomElement(bankNames);
        await Payment.create({
          panelId: panel._id,
          paymentType: 'IP Charges',
          amountReceived: ipReceived,
          paymentMode: mode,
          bankName: bank,
          quantity: 0,
          unitPrice: 0,
          billAmount: 0,
          remark: 'Server IP configuration charges received',
          addedBy: admin._id,
          timestamp: getPastDate(40)
        });
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `Received payment of ₹${ipReceived} (IP Charges) from panel ${panel.panelName} via ${mode}`,
          timestamp: getPastDate(40)
        });
      }

      // Month 2: Maintenance Bill (30 days ago)
      await Payment.create({
        panelId: panel._id,
        paymentType: 'Maintenance',
        amountReceived: 0,
        paymentMode: 'UPI',
        bankName: '',
        quantity: 1,
        unitPrice: panel.maintenanceCharges,
        billAmount: panel.maintenanceCharges,
        remark: 'Monthly VPS maintenance and server maintenance support',
        addedBy: admin._id,
        timestamp: getPastDate(30)
      });
      await Log.create({
        userId: admin._id,
        actionType: 'ADD',
        module: 'Payment',
        details: `Generated bill of ₹${panel.maintenanceCharges} (Maintenance) for panel ${panel.panelName}`,
        timestamp: getPastDate(30)
      });

      // Month 2: Maintenance Payment Received (25 days ago)
      let maintReceived = panel.maintenanceCharges;
      if (i === 2 || i === 5 || i === 9) maintReceived = panel.maintenanceCharges / 2; // Partial payment
      if (i === 3 || i === 6) maintReceived = 0; // Unpaid maintenance

      if (maintReceived > 0) {
        const mode = getRandomElement(paymentModes);
        const bank = mode === 'Cash' ? '' : getRandomElement(bankNames);
        await Payment.create({
          panelId: panel._id,
          paymentType: 'Maintenance',
          amountReceived: maintReceived,
          paymentMode: mode,
          bankName: bank,
          quantity: 0,
          unitPrice: 0,
          billAmount: 0,
          remark: maintReceived === panel.maintenanceCharges ? 'Received maintenance support fees' : 'Received partial maintenance support fees',
          addedBy: admin._id,
          timestamp: getPastDate(25)
        });
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `Received payment of ₹${maintReceived} (Maintenance) from panel ${panel.panelName} via ${mode}`,
          timestamp: getPastDate(25)
        });
      }

      // Month 2: License Bill (15 days ago)
      await Payment.create({
        panelId: panel._id,
        paymentType: 'License',
        amountReceived: 0,
        paymentMode: 'UPI',
        bankName: '',
        quantity: 1,
        unitPrice: panel.licenseCharges,
        billAmount: panel.licenseCharges,
        remark: 'Monthly subscription renewal license fees',
        addedBy: admin._id,
        timestamp: getPastDate(15)
      });
      await Log.create({
        userId: admin._id,
        actionType: 'ADD',
        module: 'Payment',
        details: `Generated bill of ₹${panel.licenseCharges} (License) for panel ${panel.panelName}`,
        timestamp: getPastDate(15)
      });

      // Month 2: License Payment Received (10 days ago)
      let lic2Received = panel.licenseCharges;
      if (i === 1 || i === 4 || i === 7) lic2Received = panel.licenseCharges; // Paid fully
      if (i === 0 || i === 8) lic2Received = panel.licenseCharges - 10000; // Paid partially
      if (i === 2 || i === 3 || i === 5 || i === 6 || i === 9) lic2Received = 0; // Not paid yet

      if (lic2Received > 0) {
        const mode = getRandomElement(paymentModes);
        const bank = mode === 'Cash' ? '' : getRandomElement(bankNames);
        await Payment.create({
          panelId: panel._id,
          paymentType: 'License',
          amountReceived: lic2Received,
          paymentMode: mode,
          bankName: bank,
          quantity: 0,
          unitPrice: 0,
          billAmount: 0,
          remark: lic2Received === panel.licenseCharges ? 'Received license renewal fees' : 'Received partial license renewal fees',
          addedBy: admin._id,
          timestamp: getPastDate(10)
        });
        await Log.create({
          userId: admin._id,
          actionType: 'ADD',
          module: 'Payment',
          details: `Received payment of ₹${lic2Received} (License) from panel ${panel.panelName} via ${mode}`,
          timestamp: getPastDate(10)
        });
      }
    }

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
