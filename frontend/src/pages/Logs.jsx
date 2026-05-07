import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import {
  ClipboardList,
  Calendar,
  User,
  ShieldCheck,
  PlusCircle,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/logs');
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        setError(err.message || 'Failed to sync activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">Fetching Activity audit trail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-6 text-rose-400 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Failed to load Activity audit trail</h3>
          <p className="text-sm text-rose-400/80 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Activity Logs</h2>
        <p className="text-sm text-slate-400">Audit trail tracking all additions, modifications, and deletions in the ledger system.</p>
      </div>

      <div className="rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl relative">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl"></div>

        <div className="relative space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {logs.map((log, index) => {
            const date = new Date(log.timestamp);
            const actionType = log.actionType; // ADD, EDIT, DELETE

            return (
              <div key={log._id || index} className="flex gap-4 relative">
                {/* Connecting line between log markers */}
                {index !== logs.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-slate-800"></div>
                )}

                {/* Marker icon */}
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 z-10 ${
                    actionType === 'ADD'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : actionType === 'EDIT'
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {actionType === 'ADD' ? (
                    <PlusCircle className="h-5 w-5" />
                  ) : actionType === 'EDIT' ? (
                    <Edit className="h-5 w-5" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </div>

                {/* Details box */}
                <div className="flex-1 rounded-xl bg-slate-900/40 border border-slate-800/80 p-4 hover:border-slate-700/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          actionType === 'ADD'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : actionType === 'EDIT'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {actionType}
                      </span>
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{log.module} MODULE</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{date.toLocaleDateString()}</span>
                      <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <p className="text-slate-200 text-sm font-medium leading-relaxed mb-3">{log.details}</p>

                  <div className="flex items-center gap-2 text-xs border-t border-slate-800/60 pt-2.5">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-400">{log.userId?.name || 'Super Admin'}</span>
                    <span className="text-slate-600">•</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-indigo-400 font-semibold">{log.userId?.role || 'Admin'}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
              <ClipboardList className="h-10 w-10 text-slate-600" />
              <p className="font-semibold">No system activity logged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
