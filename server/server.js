const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Hooking
app.use('/api/auth', require('./routes/auth'));
app.use('/api/panels', require('./routes/panels'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/logs', require('./routes/logs'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy and running' });
});

// Seed default Super Admin user if none exists
// const seedAdmin = async () => {
//   try {
//     const adminCount = await User.countDocuments({ role: 'Admin' });
//     if (adminCount === 0) {
//       const adminEmail = 'admin@panel.com';
//       const adminPassword = 'adminpassword'; // User can change this in User Management

//       await User.create({
//         name: 'Super Admin',
//         email: adminEmail,
//         password: adminPassword,
//         role: 'Admin',
//         permissions: ['view_panels', 'add_payments', 'view_reports', 'edit_payments'],
//       });

//       console.log('----------------------------------------------------');
//       console.log(' SEED SYSTEM: Default Super Admin created successfully!');
//       console.log(` Email: ${adminEmail}`);
//       console.log(` Password: ${adminPassword}`);
//       console.log('----------------------------------------------------');
//     }
//   } catch (error) {
//     console.error('Failed to seed default Admin:', error.message);
//   }
// };

// seedAdmin();

// Set Port and listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
