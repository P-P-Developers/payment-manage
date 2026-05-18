// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const DB_URI = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;

//     const conn = await mongoose.connect(DB_URI);

//     console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
//   } catch (error) {
//     console.error(`MongoDB Connection Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

"use strict";

const mongoose = require("mongoose");

const getISTTime = () => {
  const istDate = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  });

  // Convert from "1/7/2025, 18:42:31" → "2025-07-01 18:42:31"
  const [datePart, timePart] = istDate.split(", ");
  const [day, month, year] = datePart.split("/");

  return `[${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart} IST]`;
};


const connectDB = async () => {
  try {
    const db_connect = process.env.MONGO_URI;

    await mongoose.connect(db_connect, {
      dbName: process.env.DB_NAME,
    });

    console.log(getISTTime() + " ✅ Connected to MongoDB ");

    mongoose.connection.on("error", (error) => {
      console.log(getISTTime() + " ❌ MongoDB Connection Error at IST Time:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log(getISTTime() + "⚠️ MongoDB connection lost at IST Time:");
      connectToMongoDB();
    });

  } catch (error) {
    console.log(getISTTime() + " 🚫 Failed to connect to MongoDB at IST Time:", error);
  }
};

module.exports = connectDB
