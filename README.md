# Payment Manage System

## Database Backup and Restore

### Automated Daily Backups
The system is configured to automatically backup the entire MongoDB database every night at **11:45 PM**.
- **Cron Job Script**: `server/cron/jobs/databaseBackup.js`
- **Backup Location**: All backups are stored in the `backups/` directory at the root of the project (e.g. `backups/backup_2026-07-04/`).
- **Format**: The backup uses standard `EJSON` (Extended JSON) to ensure complex MongoDB objects like `ObjectIds` and `Dates` are correctly preserved.

### How to Restore a Backup
If you ever need to restore the database from a previous backup, you can use the built-in restoration script.

**Usage:**
1. Open your terminal and navigate to the `server/scripts/` directory:
   ```bash
   cd server/scripts
   ```
2. Run the `restoreBackup.js` script, passing the exact name of the backup folder you want to restore from:
   ```bash
   node restoreBackup.js <backup_folder_name>
   ```
   **Example:**
   ```bash
   node restoreBackup.js backup_2026-07-04
   ```

**Note:** If the folder name you provide does not exist, the script will automatically create an empty folder with that name and inform you that there is nothing to restore.
