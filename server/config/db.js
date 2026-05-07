const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const DB_URI = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;

    const conn = await mongoose.connect(DB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;