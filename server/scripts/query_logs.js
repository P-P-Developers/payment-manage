const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Log = require('../models/Log');

dotenv.config();

const run = async () => {
  await connectDB();
  const logs = await Log.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log('--- RECENT LOGS ---');
  logs.forEach((l, idx) => {
    console.log(`[${idx + 1}] Date: ${l.createdAt}, Module: ${l.module}, Action: ${l.actionType}, Details: ${l.details}`);
  });
  console.log('--- END OF LOGS ---');
  mongoose.connection.close();
};

run();
