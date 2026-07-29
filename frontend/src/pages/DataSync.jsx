import React, { useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Server, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';

const DataSync = () => {
  const [ipData, setIpData] = useState(null);
  const [licenseData, setLicenseData] = useState(null);

  const [ipLoading, setIpLoading] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  const [ipFixing, setIpFixing] = useState(false);
  const [licenseFixing, setLicenseFixing] = useState(false);

  const [ipMessage, setIpMessage] = useState(null);
  const [licenseMessage, setLicenseMessage] = useState(null);

  const checkIp = async () => {
    setIpLoading(true);
    setIpMessage(null);
    try {
      const data = await apiRequest('/sync/check-ip');
      setIpData(data.data);
    } catch (err) {
      setIpMessage({ type: 'error', text: err.message || 'Failed to check IP discrepancies' });
    } finally {
      setIpLoading(false);
    }
  };

  const fixIp = async () => {
    setIpFixing(true);
    setIpMessage(null);
    try {
      const res = await apiRequest('/sync/fix-ip', { method: 'POST' });
      setIpMessage({ type: 'success', text: `Fixed ${res.fixedMissing} missing entries and ${res.fixedMismatch} mismatches.` });
      await checkIp(); // Re-fetch to show updated status
    } catch (err) {
      setIpMessage({ type: 'error', text: err.message || 'Failed to fix IP discrepancies' });
    } finally {
      setIpFixing(false);
    }
  };

  const checkLicense = async () => {
    setLicenseLoading(true);
    setLicenseMessage(null);
    try {
      const data = await apiRequest('/sync/check-license');
      setLicenseData(data.data);
    } catch (err) {
      setLicenseMessage({ type: 'error', text: err.message || 'Failed to check License discrepancies' });
    } finally {
      setLicenseLoading(false);
    }
  };

  const fixLicense = async () => {
    setLicenseFixing(true);
    setLicenseMessage(null);
    try {
      const res = await apiRequest('/sync/fix-license', { method: 'POST' });
      setLicenseMessage({ type: 'success', text: `Fixed ${res.fixedMissing} missing entries and ${res.fixedMismatch} mismatches.` });
      await checkLicense(); // Re-fetch to show updated status
    } catch (err) {
      setLicenseMessage({ type: 'error', text: err.message || 'Failed to fix License discrepancies' });
    } finally {
      setLicenseFixing(false);
    }
  };

  const hasDiscrepancies = (data) => {
    if (!data) return false;
    return (data.missingEntries?.length > 0) || (data.countMismatches?.length > 0) || (data.panelSummaries?.length > 0);
  };

  const renderCard = (title, icon, data, loading, fixing, checkFn, fixFn, message) => {
    const discrepanciesExist = hasDiscrepancies(data);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            {icon}
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        </div>

        <div className="flex-1 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare SmartAlgo history against local Payments database to find and resolve missing or mismatched billing records.
          </p>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
              {message.text}
            </div>
          )}

          {!data && !loading && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
              Click Check to analyze current database status.
            </div>
          )}

          {loading && (
            <div className="py-8 flex justify-center items-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Missing Entries</div>
                  <div className={`text-2xl font-bold ${data.missingEntries.length > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {data.missingEntries.length}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Count Mismatches</div>
                  <div className={`text-2xl font-bold ${data.countMismatches.length > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {data.countMismatches.length}
                  </div>
                </div>
              </div>

              {discrepanciesExist ? (
                <>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Action Required</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
                        Discrepancies were found. You can automatically fix these issues by clicking the Fix button below.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-4 max-h-52 overflow-y-auto flex flex-col gap-3">
                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Discrepancy Logs</h5>

                    {data.missingEntries?.map((item, idx) => (
                      <div key={`missing-${idx}`} className="text-sm pb-3 border-b border-slate-200 dark:border-slate-700/50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">Missing Entry</span>
                          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded">{item.date}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          Panel <span className="font-semibold text-slate-900 dark:text-white">"{item.panelName}"</span> is missing {item.apiCount} entries in local DB.
                        </div>
                      </div>
                    ))}

                    {data.countMismatches?.map((item, idx) => (
                      <div key={`mismatch-${idx}`} className="text-sm pb-3 border-b border-slate-200 dark:border-slate-700/50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">Count Mismatch</span>
                          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded">{item.date}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          Panel <span className="font-semibold text-slate-900 dark:text-white">"{item.panelName}"</span> API count is {item.apiCount}, but DB has {item.dbQuantity} <span className="text-slate-500 dark:text-slate-400">(Diff: {item.difference > 0 ? '+' : ''}{item.difference})</span>.
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 flex gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">All Synced</h4>
                    <p className="text-sm text-emerald-700 dark:text-emerald-500/80 mt-1">
                      Local DB exactly matches the external API history. No action required.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={checkFn}
            disabled={loading || fixing}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Check Now
          </button>

          <button
            onClick={fixFn}
            disabled={!discrepanciesExist || loading || fixing}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {fixing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
            Fix Discrepancies
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data Synchronization</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Verify and synchronize billing history between SmartAlgo and local database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {renderCard(
          "IP Billing Sync All panels ",
          <Server className="h-6 w-6" />,
          ipData, ipLoading, ipFixing, checkIp, fixIp, ipMessage
        )}

        {renderCard(
          "License Billing Sync Algo panels",
          <Database className="h-6 w-6" />,
          licenseData, licenseLoading, licenseFixing, checkLicense, fixLicense, licenseMessage
        )}
      </div>
    </div>
  );
};

export default DataSync;
