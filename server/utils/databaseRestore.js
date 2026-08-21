const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

/**
 * Utility to restore database from a backup folder
 */
module.exports = async (folderName) => {
    try {
        console.log(`[System] Starting database restore from ${folderName}...`);

        if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
            return { success: false, error: 'Database not connected' };
        }

        const backupsDir = path.join(__dirname, '../backups');
        const restorePath = path.join(backupsDir, folderName);

        if (!fs.existsSync(restorePath)) {
            return { success: false, error: 'Backup folder not found' };
        }

        const files = fs.readdirSync(restorePath);
        
        for (let file of files) {
            if (file.endsWith('.json')) {
                const collectionName = file.replace('.json', '');
                const filePath = path.join(restorePath, file);
                
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const data = EJSON.parse(fileContent);

                    if (Array.isArray(data) && data.length > 0) {
                        const collection = mongoose.connection.db.collection(collectionName);
                        // Wipe existing data
                        await collection.deleteMany({});
                        // Insert backup data
                        await collection.insertMany(data);
                        console.log(`[System] Restored collection: ${collectionName} (${data.length} docs)`);
                    } else if (Array.isArray(data) && data.length === 0) {
                        // Just wipe it if backup was empty
                        const collection = mongoose.connection.db.collection(collectionName);
                        await collection.deleteMany({});
                        console.log(`[System] Cleared collection: ${collectionName} (was empty in backup)`);
                    }
                } catch (colErr) {
                    console.error(`[System] Error restoring collection ${collectionName}:`, colErr);
                    return { success: false, error: `Error restoring collection ${collectionName}` };
                }
            }
        }

        console.log(`[System] ✅ Database restore completed successfully from ${folderName}`);
        return { success: true };

    } catch (error) {
        console.error("[System] Restore Fatal Error:", error);
        return { success: false, error: error.message };
    }
};
