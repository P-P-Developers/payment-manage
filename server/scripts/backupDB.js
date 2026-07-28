/**
 * backupDB.js
 * -----------
 * MongoDB ka pura backup lene ka script.
 * Backup ek timestamped folder mein save hoga.
 *
 * Usage:
 *   node scripts/backupDB.js              <- Backup lo
 *   node scripts/backupDB.js --list       <- Sabhi backups dekho
 *   node scripts/backupDB.js --restore backups/backup_2026-07-28_15-30-00  <- Restore karo
 */

require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ─── Config ────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Full path to MongoDB tools (in case system PATH not updated yet after fresh install)
const MONGO_TOOLS_BIN = "C:\\Program Files\\MongoDB\\Tools\\100\\bin";
const MONGODUMP = fs.existsSync(path.join(MONGO_TOOLS_BIN, "mongodump.exe"))
  ? `"${path.join(MONGO_TOOLS_BIN, "mongodump.exe")}"`
  : "mongodump";
const MONGORESTORE = fs.existsSync(path.join(MONGO_TOOLS_BIN, "mongorestore.exe"))
  ? `"${path.join(MONGO_TOOLS_BIN, "mongorestore.exe")}"`
  : "mongorestore";

// ─── Helpers ───────────────────────────────────────────────────────────────
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

function log(msg, type = "info") {
  const colors = { info: "\x1b[36m", success: "\x1b[32m", error: "\x1b[31m", warn: "\x1b[33m" };
  const reset = "\x1b[0m";
  const prefix = { info: "i", success: "OK", error: "ERR", warn: "!!" };
  console.log(`${colors[type]}[${prefix[type]}] ${msg}${reset}`);
}

// ─── Folder Size Utility ───────────────────────────────────────────────────
function getFolderSize(folderPath) {
  let totalSize = 0;
  try {
    const items = fs.readdirSync(folderPath);
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        totalSize += getFolderSize(itemPath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (_) {
    // ignore
  }
  return totalSize;
}

// ─── Backup Function ───────────────────────────────────────────────────────
function takeBackup() {
  if (!MONGO_URI || !DB_NAME) {
    log("MONGO_URI ya DB_NAME .env mein nahi mila!", "error");
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Backup directory banayi: ${BACKUP_DIR}`, "info");
  }

  const timestamp = getTimestamp();
  const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);

  log(`Database    : ${DB_NAME}`, "info");
  log(`Save hoga   : ${backupPath}`, "info");
  log("Backup shuru ho raha hai...\n", "info");

  try {
    const cmd = `${MONGODUMP} --uri="${MONGO_URI}" --db="${DB_NAME}" --out="${backupPath}"`;
    execSync(cmd, { stdio: "inherit" });

    const dbBackupPath = path.join(backupPath, DB_NAME);
    if (fs.existsSync(dbBackupPath)) {
      const files = fs.readdirSync(dbBackupPath);
      const collectionCount = files.filter((f) => f.endsWith(".bson")).length;
      const totalSize = getFolderSize(backupPath);

      log(`Backup safaltapurvak complete!`, "success");
      log(`Collections  : ${collectionCount}`, "success");
      log(`Total size   : ${(totalSize / 1024 / 1024).toFixed(2)} MB`, "success");
      log(`Backup path  : ${backupPath}`, "success");

      // Save restore instructions inside backup folder
      const instructions = `# Restore Instructions

Backup Date : ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
Database    : ${DB_NAME}
Collections : ${collectionCount}
Backup Path : ${backupPath}

## Script se restore karo:
node scripts/backupDB.js --restore "${backupPath}"

## Ya directly terminal se:
mongorestore --uri="<MONGO_URI_HERE>" --db="${DB_NAME}" --drop "${dbBackupPath}"

## Note:
- --drop flag pehle existing data delete karega phir fresh import karega
- Agar existing data rakhna ho toh --drop flag hata do (merge ho jayega)
`;
      fs.writeFileSync(path.join(backupPath, "RESTORE_INSTRUCTIONS.txt"), instructions);
      log("Restore instructions file bhi save ki gayi.", "info");
    } else {
      log("Backup folder mein data nahi mila. Kuch galat hua.", "error");
      process.exit(1);
    }
  } catch (err) {
    log(`Backup failed: ${err.message}`, "error");
    log("Make sure 'mongodump' installed hai.", "warn");
    log("Download: https://www.mongodb.com/try/download/database-tools", "warn");
    process.exit(1);
  }
}

// ─── Restore Function ──────────────────────────────────────────────────────
function restoreBackup(restorePath) {
  if (!MONGO_URI || !DB_NAME) {
    log("MONGO_URI ya DB_NAME .env mein nahi mila!", "error");
    process.exit(1);
  }

  const absoluteRestorePath = path.isAbsolute(restorePath)
    ? restorePath
    : path.join(__dirname, "..", restorePath);

  const dbDumpPath = path.join(absoluteRestorePath, DB_NAME);

  if (!fs.existsSync(dbDumpPath)) {
    log(`Restore path nahi mili: ${dbDumpPath}`, "error");
    log(`Sahi path provide karo jahan backup_XXXX folder hai.`, "warn");
    process.exit(1);
  }

  log(`Database      : ${DB_NAME}`, "info");
  log(`Restore from  : ${dbDumpPath}`, "info");
  log("WARNING: --drop flag use hoga. Existing data DELETE hoga pehle!", "warn");
  log("Restore shuru ho raha hai...\n", "info");

  try {
    const cmd = `${MONGORESTORE} --uri="${MONGO_URI}" --db="${DB_NAME}" --drop "${dbDumpPath}"`;
    execSync(cmd, { stdio: "inherit" });
    log("Restore safaltapurvak complete!", "success");
    log(`Database '${DB_NAME}' wapas aa gaya.`, "success");
  } catch (err) {
    log(`Restore failed: ${err.message}`, "error");
    process.exit(1);
  }
}

// ─── List Backups ──────────────────────────────────────────────────────────
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log("Koi backup nahi mila abhi tak. Pehle backup lo.", "warn");
    return;
  }

  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_"))
    .sort()
    .reverse();

  if (backups.length === 0) {
    log("Koi backup nahi mila.", "warn");
    return;
  }

  log(`Total ${backups.length} backup(s) available:\n`, "info");
  backups.forEach((b, i) => {
    const fullPath = path.join(BACKUP_DIR, b);
    const size = getFolderSize(fullPath);
    console.log(`  ${i + 1}. ${b}  [${(size / 1024 / 1024).toFixed(2)} MB]`);
  });
  console.log("\nRestore command:");
  console.log(`  node scripts/backupDB.js --restore backups/<backup_name>\n`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args[0] === "--restore") {
  if (!args[1]) {
    log("Restore path provide karo.", "error");
    log("Example: node scripts/backupDB.js --restore backups/backup_2026-07-28_15-30-00", "warn");
    process.exit(1);
  }
  restoreBackup(args[1]);
} else if (args[0] === "--list") {
  listBackups();
} else {
  takeBackup();
}
