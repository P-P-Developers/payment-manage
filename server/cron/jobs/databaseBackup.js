const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

/**
 * Job: Daily Database Backup
 * Frequency: Every night at 11:45 PM (45 23 * * *)
 * Description: Takes a daily backup of all MongoDB collections and saves as EJSON format for easy restoration.
 */
module.exports = async () => {
    try {
        console.log(`[Cron Job] [${new Date().toISOString()}] Starting daily database backup...`);

        // Check if database is fully connected before proceeding
        if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
            return { success: false, error: 'Database not connected' };
        }


        const backupDir = path.join(__dirname, '../../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const folderName = path.join(backupDir, `backup_${dateString}`);

        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();

        for (let collection of collections) {
            try {
                const name = collection.name;
                const data = await mongoose.connection.db.collection(name).find({}).toArray();

                // Using EJSON to preserve MongoDB ObjectIds and Dates properly
                fs.writeFileSync(path.join(folderName, `${name}.json`), EJSON.stringify(data, null, 2));
                console.log(`[Cron Job] Backed up collection: ${name} (${data.length} documents)`);
            } catch (collectionError) {
            }
        }

        console.log(`[Cron Job] ✅ Backup completed successfully at ${folderName}`);
        return { success: true, backupLocation: folderName };

    } catch (error) {
        return { success: false, error: error.message };
    }
};
