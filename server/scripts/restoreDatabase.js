const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { EJSON } = require('bson');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const restoreDatabase = async () => {
    try {
        const backupFolderName = process.argv[2];
        
        if (!backupFolderName) {
            console.error("❌ Please provide the backup folder path.");
            console.error("Usage: node restoreDatabase.js <path_to_backup_folder>");
            console.error("Example: node restoreDatabase.js ../../backups/backup_2026-07-04");
            process.exit(1);
        }

        const backupDir = path.resolve(process.cwd(), backupFolderName);

        if (!fs.existsSync(backupDir)) {
            console.error(`❌ Backup folder not found: ${backupDir}`);
            process.exit(1);
        }

        await connectDB();
        console.log(`✅ Connected to database.`);
        console.log(`📂 Reading backup from: ${backupDir}`);

        const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));

        if (files.length === 0) {
            console.log("⚠️ No .json backup files found in the specified folder.");
            process.exit(0);
        }

        console.log(`⚠️ WARNING: This will delete existing data in the collections being restored and replace it with the backup.`);
        
        for (const file of files) {
            const collectionName = file.replace('.json', '');
            const filePath = path.join(backupDir, file);
            
            console.log(`\n⏳ Restoring collection: ${collectionName}...`);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = EJSON.parse(fileContent);

            if (data.length > 0) {
                const collection = mongoose.connection.db.collection(collectionName);
                
                try {
                    // Clear existing data in the collection before restoring
                    await collection.deleteMany({});
                    console.log(`   🗑️  Cleared existing data in ${collectionName}`);

                    // Insert backup data
                    await collection.insertMany(data);
                    console.log(`   ✅ Successfully restored ${data.length} documents into ${collectionName}`);
                } catch (err) {
                    console.error(`   ❌ Error inserting data into ${collectionName}:`, err.message);
                }
            } else {
                console.log(`   ⚠️ No data found in ${file}. Skipping.`);
            }
        }

        console.log("\n🎉 Database restore completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Error during restore:", error);
        process.exit(1);
    }
};

restoreDatabase();
