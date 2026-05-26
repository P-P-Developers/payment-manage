import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-50/90 dark:bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 scale-in-center z-10 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex gap-4 items-start mt-2">
          {/* Warning Icon Container */}
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/5">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{message}</p>
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-900">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 font-semibold px-4 py-2.5 text-sm transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-slate-900 dark:text-white font-semibold px-5 py-2.5 text-sm transition-all shadow-lg shadow-rose-600/10 active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
