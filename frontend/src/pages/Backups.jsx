import { useState, useEffect } from 'react';
import { apiRequest, clearAuth } from '../utils/api';
import { Database, HardDrive, Trash2, Edit3, Save, X, Search, FileJson, Plus, RotateCcw, AlertOctagon } from 'lucide-react';

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingBackup, setEditingBackup] = useState(null);
  const [editName, setEditName] = useState('');
  
  const [deletingBackup, setDeletingBackup] = useState(null);
  const [creating, setCreating] = useState(false);

  const [restoringBackup, setRestoringBackup] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/backups');
      if (res.success) {
        setBackups(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRename = async () => {
    if (!editName.trim() || !editingBackup) return;
    try {
      const res = await apiRequest(`/backups/${editingBackup.name}`, {
        method: 'PUT',
        body: JSON.stringify({ newName: editName.trim() })
      });
      if (res.success) {
        setEditingBackup(null);
        fetchBackups();
      }
    } catch (err) {
      alert(err.message || 'Failed to rename backup');
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await apiRequest('/backups', { method: 'POST' });
      if (res.success) {
        fetchBackups();
      } else {
        alert(res.message || 'Failed to create backup');
      }
    } catch (err) {
      alert(err.message || 'Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBackup) return;
    try {
      const res = await apiRequest(`/backups/${deletingBackup.name}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setDeletingBackup(null);
        fetchBackups();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete backup');
    }
  };

  const handleRestore = async () => {
    if (restoreConfirmText !== 'RESTORE' || !restoringBackup) return;
    setIsRestoring(true);
    try {
      const res = await apiRequest(`/backups/${restoringBackup.name}/restore`, { method: 'POST' });
      if (res.success) {
        alert("Database restored successfully! You will be logged out to refresh your session.");
        clearAuth();
        window.location.href = '/#/login'; 
      } else {
        alert(res.message || 'Failed to restore backup');
        setIsRestoring(false);
      }
    } catch (err) {
      alert(err.message || 'Error restoring backup');
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredBackups = backups.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && backups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
          <HardDrive className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Database Backups</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and secure your automated daily database snapshots.</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative group w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search backups..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            {creating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Backup
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3">
          <X className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 w-16">S. No</th>
                <th className="px-6 py-4">Backup Name</th>
                <th className="px-6 py-4">Date Created</th>
                <th className="px-6 py-4">Files</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    <Database className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    No backups found
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup, index) => (
                  <tr key={backup.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 dark:text-slate-500">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4">
                      {editingBackup?.name === backup.name ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                          />
                          <button onClick={handleRename} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm">
                            <Save className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingBackup(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <FileJson className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{backup.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {backup.fileCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {formatBytes(backup.sizeBytes)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => {
                            setRestoringBackup(backup);
                            setRestoreConfirmText('');
                          }}
                          disabled={editingBackup !== null}
                          className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Restore"
                        >
                          <RotateCcw className="h-4.5 w-4.5" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingBackup(backup);
                            setEditName(backup.name);
                          }}
                          disabled={editingBackup !== null}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
                          title="Rename"
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </button>
                        <button 
                          onClick={() => setDeletingBackup(backup)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-5 mx-auto">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Delete Backup?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium mb-8">
              Are you sure you want to permanently delete <span className="font-bold text-slate-700 dark:text-slate-300">{deletingBackup.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingBackup(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95"
              >
                Delete Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoringBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-rose-500 dark:border-rose-500/50">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-5 mx-auto">
              <AlertOctagon className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight text-rose-600 dark:text-rose-500">Warning: Database Overwrite</h3>
            <p className="text-slate-600 dark:text-slate-300 text-center text-sm font-medium mb-4 leading-relaxed">
              You are about to restore the backup <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded">{restoringBackup.name}</span>.
            </p>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 mb-6">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold text-center">
                This will WIPE all current live data and replace it with this snapshot. A safety backup of the current state will be taken automatically before restoring.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Type "RESTORE" to confirm</label>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setRestoringBackup(null)}
                disabled={isRestoring}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRestore}
                disabled={restoreConfirmText !== 'RESTORE' || isRestoring}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isRestoring ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
                {isRestoring ? 'Restoring...' : 'RESTORE NOW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
