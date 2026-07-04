const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const restoreBackup = async () => {
    // Check if the user provided a folder name argument
    const folderName = process.argv[2];
    if (!folderName) {
        console.error("❌ Please provide the backup folder name.");
        console.error("Usage: node restoreBackup.js <backup_folder_name>");
        console.error("Example: node restoreBackup.js backup_2026-07-04");
        process.exit(1);
    }

    try {
        const DB_URI = process.env.MONGO_URI;
        await mongoose.connect(DB_URI, { dbName: process.env.DB_NAME });
        console.log(`✅ Connected to MongoDB (${process.env.DB_NAME}) for restoration.`);

        const backupPath = path.join(__dirname, '../../backups', folderName);
        
        if (!fs.existsSync(backupPath)) {
            console.log(`⚠️ Backup folder not found. Creating it now: ${backupPath}`);
            fs.mkdirSync(backupPath, { recursive: true });
            console.log(`✅ Empty folder created. Nothing to restore.`);
            process.exit(0);
        }

        const files = fs.readdirSync(backupPath);
        
        for (let file of files) {
            if (file.endsWith('.json')) {
                const collectionName = file.replace('.json', '');
                console.log(`Restoring collection: ${collectionName}...`);
                
                const rawData = fs.readFileSync(path.join(backupPath, file), 'utf8');
                const data = EJSON.parse(rawData);
                
                if (data.length > 0) {
                    // Optional: Clear existing collection data before restoring
                    // await mongoose.connection.db.collection(collectionName).deleteMany({});
                    
                    // Insert the data
                    await mongoose.connection.db.collection(collectionName).insertMany(data);
                    console.log(`✅ Successfully restored ${data.length} documents into ${collectionName}.`);
                } else {
                    console.log(`⚠️ Collection ${collectionName} backup is empty. Skipping.`);
                }
            }
        }
        
        console.log(`🎉 Database restoration from ${folderName} completed successfully!`);
        process.exit(0);
        
    } catch (error) {
        console.error("❌ Error during database restoration:", error);
        process.exit(1);
    }
};

restoreBackup();
