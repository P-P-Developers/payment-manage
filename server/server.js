const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const cronScheduler = require('./cron/cronScheduler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize scheduled cron jobs
cronScheduler.init();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes Hooking
app.use('/api/auth', require('./routes/auth'));
app.use('/api/panels', require('./routes/panels'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/smtp', require('./routes/smtp'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/banks', require('./routes/banks'));
app.use('/api/payment-types', require('./routes/payment-types'));
app.use('/api/settings', require('./routes/settings'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy and running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
