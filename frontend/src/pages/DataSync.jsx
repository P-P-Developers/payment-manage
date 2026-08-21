import React, { useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Server, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import RotateCaptchaModal from '@/components/RotateCaptchaModal';

const DataSync = () => {
  const [ipData, setIpData] = useState(null);
  const [licenseData, setLicenseData] = useState(null);

  const [ipLoading, setIpLoading] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);

  const [ipFixing, setIpFixing] = useState(false);
  const [licenseFixing, setLicenseFixing] = useState(false);

  const [ipMessage, setIpMessage] = useState(null);
  const [licenseMessage, setLicenseMessage] = useState(null);

  // SOP State
  const [sopData, setSopData] = useState(null);
  const [sopLoading, setSopLoading] = useState(false);
  const [sopFixing, setSopFixing] = useState(false);
  const [sopMessage, setSopMessage] = useState(null);

  const [ipSearch, setIpSearch] = useState('');
  const [licenseSearch, setLicenseSearch] = useState('');
  const [sopSearch, setSopSearch] = useState('');

  const [syncMode, setSyncMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [pendingFixFn, setPendingFixFn] = useState(null);
  const [specificFixItem, setSpecificFixItem] = useState(null);

  const handleCaptchaSuccess = () => {
    setIsCaptchaOpen(false);
    if (pendingFixFn === 'ip') fixIp();
    else if (pendingFixFn === 'license') fixLicense();
    else if (pendingFixFn === 'sop') fixSop();
    else if (pendingFixFn === 'sop-specific') fixSpecificSop(specificFixItem);
    else if (pendingFixFn === 'ip-specific') fixSpecificIp(specificFixItem);
    else if (pendingFixFn === 'license-specific') fixSpecificLicense(specificFixItem);
  };

  const openCaptchaFor = (type) => {
    setPendingFixFn(type);
    setIsCaptchaOpen(true);
  };

  const openSpecificCaptchaFor = (type, item) => {
    setPendingFixFn(type);
    setSpecificFixItem(item);
    setIsCaptchaOpen(true);
  };

  const checkIp = async () => {
    setIpLoading(true);
    setIpMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const data = await apiRequest(`/sync/check-ip${query}`);
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
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const res = await apiRequest(`/sync/fix-ip${query}`, { method: 'POST' });
      setIpMessage({ type: 'success', text: `Fixed ${res.fixedMissing} missing entries and ${res.fixedMismatch} mismatches.` });
      await checkIp(); // Re-fetch to show updated status
    } catch (err) {
      setIpMessage({ type: 'error', text: err.message || 'Failed to fix IP discrepancies' });
    } finally {
      setIpFixing(false);
    }
  };

  const fixSpecificIp = async (item) => {
    setIpFixing(true);
    setIpMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const response = await apiRequest(`/sync/fix-ip${query}`, { 
        method: 'POST',
        body: JSON.stringify({
          specificPanelName: item.panelName,
          specificDate: item.date
        })
      });
      if (response.success) {
        setIpMessage({
          type: 'success',
          text: `Fixed IP discrepancy for ${item.panelName}.`
        });
        await checkIp();
      } else {
        throw new Error(response.message || 'Failed to fix specific IP discrepancy');
      }
    } catch (err) {
      setIpMessage({ type: 'error', text: err.message || 'Failed to fix specific IP discrepancy' });
    } finally {
      setIpFixing(false);
      setSpecificFixItem(null);
    }
  };

  const checkLicense = async () => {
    setLicenseLoading(true);
    setLicenseMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const data = await apiRequest(`/sync/check-license${query}`);
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
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const res = await apiRequest(`/sync/fix-license${query}`, { method: 'POST' });
      setLicenseMessage({ type: 'success', text: `Fixed ${res.fixedMissing} missing entries and ${res.fixedMismatch} mismatches.` });
      await checkLicense(); // Re-fetch to show updated status
    } catch (err) {
      setLicenseMessage({ type: 'error', text: err.message || 'Failed to fix License discrepancies' });
    } finally {
      setLicenseFixing(false);
    }
  };

  const fixSpecificLicense = async (item) => {
    setLicenseFixing(true);
    setLicenseMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const response = await apiRequest(`/sync/fix-license${query}`, { 
        method: 'POST',
        body: JSON.stringify({
          specificPanelName: item.panelName,
          specificDate: item.date
        })
      });
      if (response.success) {
        setLicenseMessage({
          type: 'success',
          text: `Fixed License discrepancy for ${item.panelName}.`
        });
        await checkLicense();
      } else {
        throw new Error(response.message || 'Failed to fix specific License discrepancy');
      }
    } catch (err) {
      setLicenseMessage({ type: 'error', text: err.message || 'Failed to fix specific License discrepancy' });
    } finally {
      setLicenseFixing(false);
      setSpecificFixItem(null);
    }
  };

  const checkSop = async () => {
    setSopLoading(true);
    setSopMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const response = await apiRequest(`/sync/check-sop${query}`);
      if (response.success && response.data) {
        setSopData(response.data);
        setSopMessage({
          type: 'success',
          text: `Sync Complete: ${response.data.matchedData.length} Matched, ${response.data.unmatchedDbPanels.length} missing in API.`
        });
      } else {
        throw new Error(response.message || 'Failed to check SOP licenses');
      }
    } catch (err) {
      setSopMessage({ type: 'error', text: err.message || 'Failed to check SOP licenses' });
    } finally {
      setSopLoading(false);
    }
  };

  const fixSop = async () => {
    setSopFixing(true);
    setSopMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const response = await apiRequest(`/sync/fix-sop${query}`, { method: 'POST' });
      if (response.success) {
        setSopMessage({
          type: 'success',
          text: response.message || `Successfully fixed ${response.fixedMissing} SOP discrepancies.`
        });
        // Re-check to get updated data
        await checkSop();
      } else {
        throw new Error(response.message || 'Failed to fix SOP licenses');
      }
    } catch (err) {
      setSopMessage({ type: 'error', text: err.message || 'Failed to fix SOP licenses' });
    } finally {
      setSopFixing(false);
    }
  };

  const fixSpecificSop = async (item) => {
    setSopFixing(true);
    setSopMessage(null);
    try {
      const query = syncMode === 'date' && selectedDate ? `?date=${selectedDate}` : '';
      const response = await apiRequest(`/sync/fix-sop${query}`, { 
        method: 'POST',
        body: JSON.stringify({
          specificPanelId: item.localPanel._id,
          specificDate: item.sopItem["Payment Date"],
          specificAmount: item.sopItem.AmountDetails
        })
      });
      if (response.success) {
        setSopMessage({
          type: 'success',
          text: response.message || `Successfully fixed SOP discrepancy for ${item.localPanel.panelName}.`
        });
        await checkSop();
      } else {
        throw new Error(response.message || 'Failed to fix specific SOP license');
      }
    } catch (err) {
      setSopMessage({ type: 'error', text: err.message || 'Failed to fix specific SOP license' });
    } finally {
      setSopFixing(false);
      setSpecificFixItem(null);
    }
  };

  const hasDiscrepancies = (data) => {
    if (!data) return false;
    return (data.missingEntries?.length > 0) || (data.countMismatches?.length > 0) || (data.panelSummaries?.length > 0);
  };

  const renderCard = (title, icon, data, loading, fixing, checkFn, fixFn, message, search, setSearch, typePrefix) => {
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

                  <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700/50">
                      <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discrepancy Logs</h5>
                      <input 
                        type="text" 
                        placeholder="Search panel..." 
                        className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 w-10 text-center">Type</th>
                            <th className="px-3 py-2">Panel Name</th>
                            <th className="px-3 py-2">Details</th>
                            <th className="px-3 py-2 text-right">Date</th>
                            <th className="px-3 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                          {/* Missing entries */}
                          {[...data.missingEntries]
                             .filter(i => !search || i.panelName.toLowerCase().includes(search.toLowerCase()))
                             .sort((a,b)=>new Date(b.date)-new Date(a.date)).map((item, idx) => (
                               <tr key={`missing-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-3 py-2 text-center"><span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Missing</span></td>
                                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{item.panelName}</td>
                                  <td className="px-3 py-2">Missing <span className="font-bold text-slate-800 dark:text-slate-200">{item.apiCount}</span> entries</td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500 text-right">{item.date}</td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => openSpecificCaptchaFor(`${typePrefix}-specific`, item)}
                                      disabled={fixing || loading}
                                      className="text-[10px] px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-bold rounded-md transition-colors border border-blue-200 dark:border-blue-500/20"
                                    >
                                      Fix
                                    </button>
                                  </td>
                               </tr>
                             ))
                          }
                          {/* Mismatches */}
                          {[...data.countMismatches]
                             .filter(i => !search || i.panelName.toLowerCase().includes(search.toLowerCase()))
                             .sort((a,b)=>new Date(b.date)-new Date(a.date)).map((item, idx) => (
                               <tr key={`mismatch-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-3 py-2 text-center"><span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Mismatch</span></td>
                                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{item.panelName}</td>
                                  <td className="px-3 py-2">API: {item.apiCount} <span className="text-slate-300 dark:text-slate-600">|</span> DB: {item.dbQuantity} <span className="text-slate-400">({item.difference > 0 ? '+':''}{item.difference})</span></td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500 text-right">{item.date}</td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => openSpecificCaptchaFor(`${typePrefix}-specific`, item)}
                                      disabled={fixing || loading}
                                      className="text-[10px] px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-bold rounded-md transition-colors border border-blue-200 dark:border-blue-500/20"
                                    >
                                      Fix
                                    </button>
                                  </td>
                               </tr>
                             ))
                          }
                        </tbody>
                      </table>
                    </div>
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
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Data Synchronization</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Verify and synchronize billing history between SmartAlgo and local database.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Sync Scope:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="syncMode" value="all" checked={syncMode === 'all'} onChange={() => setSyncMode('all')} className="accent-blue-600 w-4 h-4" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">All Time</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="syncMode" value="date" checked={syncMode === 'date'} onChange={() => setSyncMode('date')} className="accent-blue-600 w-4 h-4" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Specific Date</span>
          </label>
          
          {syncMode === 'date' && (
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200 ml-2"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-stretch">
        {renderCard(
          "IP Billing Sync All panels ",
          <Server className="h-6 w-6" />,
          ipData, ipLoading, ipFixing, checkIp, () => openCaptchaFor('ip'), ipMessage, ipSearch, setIpSearch, 'ip'
        )}

        {renderCard(
          "License Billing Sync Algo panels",
          <Database className="h-6 w-6" />,
          licenseData, licenseLoading, licenseFixing, checkLicense, () => openCaptchaFor('license'), licenseMessage, licenseSearch, setLicenseSearch, 'license'
        )}

        {/* SOP Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <Server className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">SOP Licenses Check</h2>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fetch and verify SOP license details from the external tradestreet API for all statuses.
            </p>

            {sopMessage && (
              <div className={`p-4 rounded-xl text-sm font-medium border ${sopMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                {sopMessage.text}
              </div>
            )}

            {!sopData && !sopLoading && (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 italic">
                Click Check to pull data from SOP API.
              </div>
            )}

            {sopLoading && (
              <div className="py-8 flex justify-center items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            )}

            {sopData && !sopLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Mapped Both Sides</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                      {sopData.matchedData.length}
                    </div>
                  </div>


                </div>

                <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-4 max-h-[600px] overflow-y-auto flex flex-col gap-6">

                  {/* Category 1: DISCREPANCIES */}
                  <div>
                    <div className="flex justify-between items-center mb-2 border-b border-amber-200 dark:border-amber-800/50 pb-2">
                      <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        1. Discrepancies (Missing / Mismatch in DB)
                      </h5>
                      <input 
                        type="text" 
                        placeholder="Search panel..." 
                        className="px-2 py-1 text-xs rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500" 
                        value={sopSearch} 
                        onChange={(e) => setSopSearch(e.target.value)} 
                      />
                    </div>

                    {sopData.matchedData.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50 mt-3">
                        <table className="w-full text-left text-xs whitespace-nowrap">
                          <thead className="bg-slate-100 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                            <tr>
                              <th className="px-4 py-3 w-12 text-center">S.No.</th>
                              <th className="px-4 py-3">SOP Company (API)</th>
                              <th className="px-4 py-3">Matched Local Panel (DB)</th>
                              <th className="px-4 py-3 text-right">API Amount</th>
                              <th className="px-4 py-3">API Date</th>
                              <th className="px-4 py-3 text-center">Payment Status</th>
                              <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                            {[...sopData.matchedData]
                              .filter(m => !sopSearch || m.sopItem.Companyname?.toLowerCase().includes(sopSearch.toLowerCase()) || m.localPanel.panelName.toLowerCase().includes(sopSearch.toLowerCase()))
                              .sort((a, b) => {
                                const parseSopDate = (dStr) => {
                                  if (!dStr) return 0;
                                  const parts = dStr.split(' ');
                                  if (parts.length >= 1) {
                                    const dParts = parts[0].split('/');
                                    if (dParts.length === 3) {
                                      return new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${parts[1] || '00:00:00'}Z`).getTime();
                                    }
                                  }
                                  return new Date(dStr).getTime();
                                };
                                return parseSopDate(b.sopItem["Payment Date"]) - parseSopDate(a.sopItem["Payment Date"]);
                              }).map((match, idx) => (
                                <tr key={`match-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{match.sopItem.Companyname || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-[11px] bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                    {match.localPanel.panelName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">₹{match.sopItem.AmountDetails}</td>
                                <td className="px-4 py-3">{match.sopItem["Payment Date"]}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-1 rounded-md shadow-sm ${match.status === 'Mismatch Amount' ? 'bg-amber-100 text-amber-700 border border-amber-200 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-rose-100 text-rose-700 border border-rose-200 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                    {match.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => openSpecificCaptchaFor('sop-specific', match)}
                                    disabled={sopFixing || sopLoading}
                                    className="text-[10px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-bold rounded-md transition-colors border border-blue-200 dark:border-blue-500/20"
                                  >
                                    Fix
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400 italic py-2">No mapped records found.</div>
                    )}
                  </div>



                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={checkSop}
              disabled={sopLoading || sopFixing}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {sopLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Check Now
            </button>

            <button
              onClick={() => openCaptchaFor('sop')}
              disabled={!(sopData?.newMissingCount > 0) || sopFixing || sopLoading}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {sopFixing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
              Fix Discrepancies
            </button>
          </div>
        </div>
      </div>

      <RotateCaptchaModal
        isOpen={isCaptchaOpen}
        onClose={() => setIsCaptchaOpen(false)}
        onSuccess={handleCaptchaSuccess}
      />
    </div>
  );
};

export default DataSync;
