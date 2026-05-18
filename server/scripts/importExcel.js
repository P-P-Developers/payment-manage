const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { execSync } = require('child_process');

// Step 1: Ensure 'xlsx' library is installed for reading the spreadsheet
try {
  require('xlsx');
} catch (error) {
  console.log('The required library "xlsx" is not installed. Installing it now...');
  try {
    execSync('npm install xlsx', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('"xlsx" package installed successfully!\n');
  } catch (installError) {
    console.error('Failed to install "xlsx" automatically. Please run "npm install xlsx" manually.');
    process.exit(1);
  }
}

const XLSX = require('xlsx');

// Load environment variables from server root
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Panel = require('../models/Panel');
const Log = require('../models/Log');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const DB_URI = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;

    const db_connect = process.env.MONGO_URI;

    await mongoose.connect(db_connect, {
      dbName: process.env.DB_NAME,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Find the spreadsheet path
let excelPath = process.argv[2];

const defaultPaths = [
  'C:\\Users\\pnp infotech\\Downloads\\Payment Sheet.xlsx',
  path.join(__dirname, '../Payment Sheet.xlsx'),
  path.join(__dirname, '../../Payment Sheet.xlsx'),
  path.join(__dirname, '../../../Downloads/Payment Sheet.xlsx')
];

if (!excelPath) {
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      excelPath = p;
      break;
    }
  }
}

if (!excelPath || !fs.existsSync(excelPath)) {
  console.error('\nError: Could not find the Excel file "Payment Sheet.xlsx".');
  console.log('Please place the Excel file in one of the following locations:');
  defaultPaths.forEach(p => console.log(` - ${p}`));
  console.log('\nOr run the script by passing the path as an argument:');
  console.log('  node scripts/importExcel.js "C:\\path\\to\\Payment Sheet.xlsx"\n');
  process.exit(1);
}

console.log(`Using Excel file: ${excelPath}`);

// Intelligent key-value extractor to handle variations in Excel column headers
const extractData = (row) => {
  const keys = Object.keys(row);

  const findVal = (keywords, exactOnly = false) => {
    // 1. Try exact match (case insensitive, trimmed)
    for (const key of keys) {
      const k = key.trim().toLowerCase();
      if (keywords.some(kw => k === kw.toLowerCase())) {
        return row[key];
      }
    }
    if (exactOnly) return undefined;
    // 2. Try substring match (case insensitive)
    for (const key of keys) {
      const k = key.trim().toLowerCase();
      if (keywords.some(kw => k.includes(kw.toLowerCase()))) {
        return row[key];
      }
    }
    return undefined;
  };

  const software = findVal(['software', 'panelname'], true) || findVal(['software', 'panelname']);
  const name = findVal(['name', 'ownername'], true) || findVal(['name', 'ownername']);
  const gmail = findVal(['gmail', 'email', 'owneremail'], true) || findVal(['gmail', 'email', 'owneremail']);
  const contact = findVal(['contact no', 'contact', 'phone number', 'phone'], true) || findVal(['contact no', 'contact', 'phone number', 'phone']);

  const maintenance = findVal(['maintenance support charges', 'maintenance charges', 'maintenance'], false);
  const ipCharges = findVal(['ip routing charges', 'ip charges', 'ip routing'], false);
  const licenseCharges = findVal(['license charges', 'license'], false);
  const openingBalance = findVal(['opening balance', 'previous due', 'due dues'], false);

  return {
    software,
    name,
    gmail,
    contact,
    maintenance,
    ipCharges,
    licenseCharges,
    openingBalance
  };
};

const importData = async () => {
  await connectDB();

  // Load worksheet
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${rows.length} rows in sheet "${sheetName}". Starting import...\n`);

  // Find an admin user to associate the logs with
  const admin = await User.findOne({ role: 'Admin' }) || await User.findOne({});
  const adminId = admin ? admin._id : null;

  if (!adminId) {
    console.log('Warning: No Admin user found in the database. Activity logs will not specify userId.');
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const data = extractData(row);

    // Skip rows that don't have a software domain name
    if (!data.software) {
      console.log(`[Row ${i + 2}] Skipped: No software domain name found.`);
      skippedCount++;
      continue;
    }

    const panelName = String(data.software).trim();
    const ownerName = String(data.name || 'Owner').trim();

    // Validate and build proper email to satisfy database validators
    let ownerEmail = String(data.gmail || '').trim();
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!ownerEmail || !emailRegex.test(ownerEmail)) {
      const oldEmail = ownerEmail;
      const sanitizedName = ownerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      ownerEmail = `${sanitizedName || 'owner'}@gmail.com`;
      console.log(`[Row ${i + 2}] Generated email "${ownerEmail}" for ${ownerName} (original: "${oldEmail || 'empty'}")`);
    }

    const phoneNumber = String(data.contact || '0000000000').trim();
    const maintenanceCharges = Number(data.maintenance) || 0;
    const ipCharges = Number(data.ipCharges) || 0;
    const licenseCharges = Number(data.licenseCharges) || 0;
    const openingBalance = Number(data.openingBalance) || 0;

    // console.log("data", data)
    console.log("data === ", {
      ownerName,
      ownerEmail,
      phoneNumber,
      maintenanceCharges,
      ipCharges,
      licenseCharges,
      openingBalance
    })

    try {
      const existingPanel = await Panel.findOne({ panelName });

      if (existingPanel) {
        // Update existing panel
        existingPanel.ownerName = ownerName;
        existingPanel.ownerEmail = ownerEmail;
        existingPanel.phoneNumber = phoneNumber;
        existingPanel.maintenanceCharges = maintenanceCharges;
        existingPanel.ipCharges = ipCharges;
        existingPanel.licenseCharges = licenseCharges;
        existingPanel.openingBalance = openingBalance;

        await existingPanel.save();
        updatedCount++;
        console.log(`[Row ${i + 2}] Updated panel: ${panelName}`);

        if (adminId) {
          await Log.create({
            userId: adminId,
            actionType: 'EDIT',
            module: 'Panel',
            details: `Updated panel client "${panelName}" via Excel import.`,
          });
        }
      } else {
        // Create new panel
        await Panel.create({
          panelName,
          ownerName,
          ownerEmail,
          phoneNumber,
          maintenanceCharges,
          ipCharges,
          licenseCharges,
          openingBalance
        });
        createdCount++;
        console.log(`[Row ${i + 2}] Created panel: ${panelName} (Owner: ${ownerName})`);

        if (adminId) {
          await Log.create({
            userId: adminId,
            actionType: 'ADD',
            module: 'Panel',
            details: `Created panel client "${panelName}" (Owner: ${ownerName}) via Excel import.`,
          });
        }
      }
    } catch (err) {
      console.error(`[Row ${i + 2}] Error importing panel "${panelName}":`, err.message);
      skippedCount++;
    }
  }

  console.log('\n--- Excel Import Summary ---');
  console.log(`Successfully Created: ${createdCount}`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Skipped/Failed:       ${skippedCount}`);
  console.log('----------------------------\n');

  mongoose.connection.close();
  console.log('Database connection closed.');
  process.exit(0);
};

importData();
