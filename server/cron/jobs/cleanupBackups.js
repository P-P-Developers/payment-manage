const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'Cleanup Old Backups',
    run: async () => {
        try {
            console.log(`[Cron Job] [${new Date().toISOString()}] Starting cleanup of old backups (older than 10 days)...`);
            const backupsDir = path.join(__dirname, '../../backups');
            
            if (!fs.existsSync(backupsDir)) {
                console.log(`[Cron Job] Backups directory does not exist. Skipping.`);
                return;
            }

            const folders = fs.readdirSync(backupsDir);
            const now = Date.now();
            const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
            let deletedCount = 0;

            for (let folder of folders) {
                const folderPath = path.join(backupsDir, folder);
                const stats = fs.statSync(folderPath);
                
                // If the folder is older than 10 days
                if (stats.isDirectory() && (now - stats.birthtimeMs) > tenDaysInMs) {
                    fs.rmSync(folderPath, { recursive: true, force: true });
                    deletedCount++;
                    console.log(`[Cron Job] Deleted old backup: ${folder}`);
                }
            }

            console.log(`[Cron Job] ✅ Cleanup completed. Deleted ${deletedCount} old backup(s).`);
        } catch (error) {
            console.error("[Cron Job] Backup Cleanup Error:", error);
        }
    }
};
