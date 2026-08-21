const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const databaseBackup = require('../cron/jobs/databaseBackup');
const databaseRestore = require('../utils/databaseRestore');
const Log = require('../models/Log');

const backupsDir = path.join(__dirname, '../backups');

const getFolderDetails = (dirPath) => {
    let size = 0;
    let fileCount = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (let file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                size += stats.size;
                fileCount++;
            }
        }
    } catch (e) { }
    return { size, fileCount };
};

// @route   GET /api/backups
// @desc    Get list of all database backups
// @access  Admin
router.get('/', protect, adminOnly, (req, res) => {
    try {
        if (!fs.existsSync(backupsDir)) {
            return res.status(200).json({ success: true, data: [] });
        }
        const folders = fs.readdirSync(backupsDir);
        const backups = [];

        for (let folder of folders) {
            const folderPath = path.join(backupsDir, folder);
            const stats = fs.statSync(folderPath);
            if (stats.isDirectory()) {
                const details = getFolderDetails(folderPath);
                backups.push({
                    name: folder,
                    createdAt: stats.birthtime, // On linux, birthtime might be ctime, but Windows it's creation time.
                    sizeBytes: details.size,
                    fileCount: details.fileCount
                });
            }
        }

        // Sort by newest first
        backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({ success: true, data: backups });
    } catch (error) {
        console.error("Backups fetch error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/backups
// @desc    Trigger a manual database backup
// @access  Admin
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const result = await databaseBackup();
        if (result.success) {
            await Log.create({
                userId: req.user._id,
                actionType: 'BACKUP',
                module: 'Backup',
                details: `Created manual database backup: ${path.basename(result.backupLocation)}`,
                ipAddress: req.ip
            });
            res.status(200).json({ success: true, message: 'Backup created successfully', backupLocation: result.backupLocation });
        } else {
            res.status(500).json({ success: false, message: result.error || 'Backup failed' });
        }
    } catch (error) {
        console.error("Manual backup error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/backups/:name/restore
// @desc    Restore database from a specific backup
// @access  Admin
router.post('/:name/restore', protect, adminOnly, async (req, res) => {
    try {
        const name = req.params.name;
        
        if (name.includes('..') || name.includes('/') || name.includes('\\')) {
            return res.status(400).json({ success: false, message: 'Invalid backup name' });
        }

        const folderPath = path.join(backupsDir, name);
        if (!fs.existsSync(folderPath)) {
            return res.status(404).json({ success: false, message: 'Backup not found' });
        }

        // 1. Force a safety backup of the current state before restoring
        console.log("[System] Auto-triggering safety backup before restore...");
        await databaseBackup();

        // 2. Perform the restore
        const result = await databaseRestore(name);
        
        if (result.success) {
            await Log.create({
                userId: req.user._id,
                actionType: 'RESTORE',
                module: 'Backup',
                details: `Restored database from backup: ${name}`,
                ipAddress: req.ip
            });
            res.status(200).json({ success: true, message: 'Database restored successfully. The application state has been rolled back.' });
        } else {
            res.status(500).json({ success: false, message: result.error || 'Restore failed' });
        }
    } catch (error) {
        console.error("Backup restore error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/backups/:name
// @desc    Rename a specific backup
// @access  Admin
router.put('/:name', protect, adminOnly, async (req, res) => {
    try {
        const oldName = req.params.name;
        const newName = req.body.newName;
        
        if (!newName || typeof newName !== 'string') {
            return res.status(400).json({ success: false, message: 'New name is required' });
        }
        
        // Prevent path traversal
        if (oldName.includes('..') || newName.includes('..') || oldName.includes('/') || newName.includes('\\')) {
            return res.status(400).json({ success: false, message: 'Invalid backup name' });
        }

        const oldPath = path.join(backupsDir, oldName);
        const newPath = path.join(backupsDir, newName);

        if (!fs.existsSync(oldPath)) {
            return res.status(404).json({ success: false, message: 'Backup not found' });
        }

        if (fs.existsSync(newPath)) {
            return res.status(400).json({ success: false, message: 'Backup with this name already exists' });
        }

        fs.renameSync(oldPath, newPath);
        
        await Log.create({
            userId: req.user._id,
            actionType: 'EDIT',
            module: 'Backup',
            details: `Renamed backup from "${oldName}" to "${newName}"`,
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Backup renamed successfully' });
    } catch (error) {
        console.error("Backup rename error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/backups/:name
// @desc    Delete a specific backup
// @access  Admin
router.delete('/:name', protect, adminOnly, async (req, res) => {
    try {
        const name = req.params.name;
        
        if (name.includes('..') || name.includes('/') || name.includes('\\')) {
            return res.status(400).json({ success: false, message: 'Invalid backup name' });
        }

        const folderPath = path.join(backupsDir, name);

        if (!fs.existsSync(folderPath)) {
            return res.status(404).json({ success: false, message: 'Backup not found' });
        }

        fs.rmSync(folderPath, { recursive: true, force: true });
        
        await Log.create({
            userId: req.user._id,
            actionType: 'DELETE',
            module: 'Backup',
            details: `Deleted backup: ${name}`,
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Backup deleted successfully' });
    } catch (error) {
        console.error("Backup delete error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
