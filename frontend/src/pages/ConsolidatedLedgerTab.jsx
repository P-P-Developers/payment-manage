import { useState } from 'react';
import { Eye, Printer, Trash2, Maximize2, Minimize2 } from 'lucide-react';

const SkeletonSpreadsheetRow = () => (
  <tr className="animate-pulse border-b border-slate-300/80 dark:border-slate-800/80">
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 bg-slate-200/10 dark:bg-slate-800/10 py-2.5 w-12">
      <div className="h-3.5 w-4 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="px-4 py-2.5 text-center">
      <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

export default function ConsolidatedLedgerTab({
  // data
  panels,
  userRole,
  // handlers
  setViewingPayment,
  setSelectedReceiptPayment,
  handleDeletePaymentClick,
  handleInlineCellSave,
  getLast30DaysData,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedPanelId, setExpandedPanelId] = useState(null);
  const [expandedPanelPayments, setExpandedPanelPayments] = useState([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  const toggleExpandPanel = async (panelId, fetchPanelData) => {
    if (expandedPanelId === panelId) {
      setExpandedPanelId(null);
      setExpandedPanelPayments([]);
      return;
    }
    setExpandedPanelId(panelId);
    setExpandedLoading(true);
    try {
      const data = await fetchPanelData(panelId);
      if (data) setExpandedPanelPayments(data);
    } catch (err) {
      console.error('Failed to load panel ledger:', err);
    } finally {
      setExpandedLoading(false);
    }
  };

  return (
    <div className={`overflow-x-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] p-6 overflow-auto bg-slate-50 dark:bg-slate-950' : ''}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 text-xs font-mono border-b border-slate-300 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">Sheet1</span>
          <span className="text-slate-600 dark:text-slate-400">Consolidated Panels Ledger Sheet</span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-[11px] transition-all shadow-md active:scale-95"
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? (
              <><Minimize2 className="h-3.5 w-3.5 text-amber-400" /><span>Exit Full Screen</span></>
            ) : (
              <><Maximize2 className="h-3.5 w-3.5 text-indigo-400" /><span>Full Screen View</span></>
            )}
          </button>
        </div>
        <span className="text-slate-500 dark:text-slate-500 hidden sm:inline">
          Formula Bar: <span className="text-indigo-400">f(x)</span> = Outstanding = Opening Balance + Total Bill - Paid
        </span>
      </div>

      {/* Main consolidated table */}
      <table className="w-full text-left border border-slate-300/60 dark:border-slate-700/60 font-mono text-[13px] md:text-sm border-collapse bg-slate-100/40 dark:bg-slate-900/40">
        <thead>
          <tr className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700 font-black uppercase tracking-wider text-[13px] md:text-sm">
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 text-center text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 py-2.5 w-12">#</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-black">Panel Client</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-black">Owner Name</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">Opening Bal (₹)</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">License charges (₹)</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">IP charges (₹)</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">Maint. charges (₹)</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-emerald-300 font-black">Total Paid (₹)</th>
            <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-rose-300 font-black">Outstanding (₹)</th>
            <th className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-center text-indigo-300 font-black">Quick Ledger Link</th>
          </tr>
        </thead>
        <tbody>
          {panels.map((p, idx) => (
            <tr key={p._id} className="contents">
              {/* Main row */}
              <tr
                className={`border-b border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-100/10 dark:bg-slate-900/10' : 'bg-slate-50/20 dark:bg-slate-950/20'}`}
              >
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 bg-slate-200/10 dark:bg-slate-800/10 py-2.5 w-12">
                  {idx + 1}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-slate-900 dark:text-white break-words whitespace-normal max-w-[200px]">
                  {p.panelName}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-slate-800 dark:text-slate-200">
                  {p.ownerName}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100">
                  ₹{p.openingBalance?.toLocaleString() || '0'}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100">
                  ₹{p.licenseCharges?.toLocaleString() || '0'}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100">
                  ₹{p.ipCharges?.toLocaleString() || '0'}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100">
                  ₹{p.maintenanceCharges?.toLocaleString() || '0'}
                </td>
                <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right font-black text-emerald-300 bg-emerald-500/15">
                  ₹{p.totalPaid?.toLocaleString() || '0'}
                </td>
                <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right font-black transition-all ${p.outstanding > 0
                  ? 'bg-rose-500/15 text-rose-300'
                  : p.outstanding < 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-slate-200/20 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400'
                  }`}>
                  {p.outstanding < 0
                    ? `₹${Math.abs(p.outstanding).toLocaleString()} (Adv)`
                    : `₹${(p.outstanding || 0).toLocaleString()}`
                  }
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => toggleExpandPanel(p._id, async (panelId) => {
                      const { apiRequest } = await import('@/utils/api');
                      const data = await apiRequest(`/panels/${panelId}`);
                      return data.success ? (data.payments || []) : [];
                    })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] uppercase font-extrabold tracking-wider transition-all shadow active:scale-95 border ${expandedPanelId === p._id
                      ? 'bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-slate-900 dark:hover:text-white border-rose-500/20'
                      : 'bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-900 dark:hover:text-white border-indigo-500/20'
                      }`}
                  >
                    {expandedPanelId === p._id ? 'Close Ledger' : 'View Ledger'}
                  </button>
                </td>
              </tr>

              {/* Expanded inline panel ledger */}
              {expandedPanelId === p._id && (
                <tr className="bg-slate-50/40 dark:bg-slate-950/40 border-b border-slate-300/80 dark:border-slate-800/80">
                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 bg-slate-50/20 dark:bg-slate-950/20 py-4">
                    ↳
                  </td>
                  <td colSpan="9" className="p-4 bg-slate-50/10 dark:bg-slate-950/10">
                    <div className="space-y-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                            Chronological Ledger: <span className="text-indigo-400 font-black">{p.panelName}</span>
                          </h4>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                          {expandedPanelPayments.length} transaction entries found
                        </span>
                      </div>

                      {expandedLoading ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 animate-pulse">
                          <div className="flex items-center gap-2 px-1 py-1 text-[10px] font-mono">
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">Sheet2</span>
                            <span className="text-slate-600 dark:text-slate-400">Syncing Chronological Ledger...</span>
                          </div>
                          <table className="w-full text-left border border-slate-300 dark:border-slate-800 font-mono text-xs border-collapse bg-slate-100/10 dark:bg-slate-900/10">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-600 text-center text-[9px]">
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[4%] bg-slate-50 dark:bg-slate-950"></th>
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(l => (
                                  <th key={l} className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 bg-slate-50 dark:bg-slate-950">{l}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 2, 3, 4].map((n) => (
                                <SkeletonSpreadsheetRow key={n} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2 text-[10px] font-mono px-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">Sheet2</span>
                              <span className="text-slate-600 dark:text-slate-400">Transaction Ledger</span>
                            </div>
                            <span className="text-slate-500 text-[9px] hidden sm:inline">
                              Formula Bar: <span className="text-indigo-400">f(x)</span> = Outstanding = SUM(E - F) - SUM(G + H)
                            </span>
                          </div>

                          <table className="w-full text-left border border-slate-300 dark:border-slate-800 font-mono text-xs md:text-[13px] border-collapse bg-slate-100/10 dark:bg-slate-900/10">
                            <thead>
                              <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800 uppercase tracking-wider text-xs md:text-[13px]">
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 text-center text-slate-600 bg-slate-100 dark:bg-slate-900 py-2 w-[4%]">#</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Date</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Type</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-center w-[5%] bg-slate-100/50 dark:bg-slate-900/50">Qty</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[8%] bg-slate-100/50 dark:bg-slate-900/50">Rate</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Bill Amount</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Bill Discount</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Amt Paid</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Pay Discount</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Net Due</th>
                                <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 bg-slate-100/50 dark:bg-slate-900/50 w-[18%]">Remarks / Note</th>
                                <th className="px-3 py-2 text-center bg-slate-100/50 dark:bg-slate-900/50 w-[8%]">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getLast30DaysData(expandedPanelPayments).map((row, hIdx) => (
                                <tr
                                  key={row.id}
                                  className={`border-b border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors ${row.hasData
                                    ? 'bg-indigo-500/5 font-semibold text-slate-900 dark:text-white'
                                    : hIdx % 2 === 0 ? 'bg-slate-50/10 dark:bg-slate-950/10' : 'bg-slate-50/30 dark:bg-slate-950/30'
                                    }`}
                                >
                                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 py-2">
                                    {hIdx + 2}
                                  </td>
                                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-2 text-slate-700 dark:text-slate-300">
                                    {row.displayDate}
                                  </td>
                                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-2">
                                    {row.paymentType !== '-' ? (
                                      <span className={`px-3 py-1 rounded text-sm md:text-base font-semibold uppercase tracking-wider ${row.paymentType === 'License'
                                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                                        : row.paymentType === 'IP Charges'
                                          ? 'bg-violet-500/20 text-violet-300 border border-violet-400/40'
                                          : 'bg-amber-400/20 text-amber-200 border border-amber-400/50'
                                        }`}>
                                        {row.paymentType}
                                      </span>
                                    ) : '-'}
                                  </td>

                                  {/* Qty — inline editable */}
                                  <td
                                    className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-center ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white group' : 'text-slate-600 dark:text-slate-400'}`}
                                    onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'quantity', value: row.quantity })}
                                  >
                                    {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'quantity' ? (
                                      <input
                                        type="number"
                                        className="w-16 bg-slate-50 dark:bg-slate-950 border border-indigo-500 rounded px-1 text-center text-xs text-indigo-300 font-mono focus:outline-none"
                                        value={editingCell.value}
                                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                        onBlur={() => { handleInlineCellSave(row.originalPayment, 'quantity', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') { handleInlineCellSave(row.originalPayment, 'quantity', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                                        <span>{row.quantity}</span>
                                        {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>}
                                      </div>
                                    )}
                                  </td>

                                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right text-slate-600 dark:text-slate-400">
                                    {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                                  </td>

                                  {/* Bill Amount — inline editable */}
                                  <td
                                    className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right ${row.billAmount > 0 ? 'text-amber-400 bg-amber-400/5' : 'text-slate-500'} ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white group' : ''}`}
                                    onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'billAmount', value: row.billAmount })}
                                  >
                                    {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'billAmount' ? (
                                      <input
                                        type="number"
                                        className="w-20 bg-slate-50 dark:bg-slate-950 border border-indigo-500 rounded px-1 text-right text-xs text-indigo-300 font-mono focus:outline-none"
                                        value={editingCell.value}
                                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                        onBlur={() => { handleInlineCellSave(row.originalPayment, 'billAmount', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') { handleInlineCellSave(row.originalPayment, 'billAmount', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <span>₹{row.billAmount.toLocaleString()}</span>
                                        {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>}
                                      </div>
                                    )}
                                  </td>

                                  <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right ${row.billDiscount > 0 ? 'text-orange-400 bg-orange-400/5' : 'text-slate-500'}`}>
                                    ₹{row.billDiscount.toLocaleString()}
                                  </td>

                                  {/* Amt Paid — inline editable */}
                                  <td
                                    className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right ${row.amountReceived > 0 ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-500'} ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-emerald-300 group' : ''}`}
                                    onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'amountReceived', value: row.amountReceived })}
                                  >
                                    {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'amountReceived' ? (
                                      <input
                                        type="number"
                                        className="w-20 bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded px-1 text-right text-xs text-emerald-300 font-mono focus:outline-none"
                                        value={editingCell.value}
                                        onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                        onBlur={() => { handleInlineCellSave(row.originalPayment, 'amountReceived', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') { handleInlineCellSave(row.originalPayment, 'amountReceived', editingCell.value, expandedPanelPayments, setExpandedPanelPayments); setEditingCell(null); }
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <span>₹{row.amountReceived.toLocaleString()}</span>
                                        {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>}
                                      </div>
                                    )}
                                  </td>

                                  <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right ${row.paymentDiscount > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500'}`}>
                                    ₹{row.paymentDiscount.toLocaleString()}
                                  </td>

                                  <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right ${(row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount) > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500'}`}>
                                    ₹{((row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount)).toLocaleString()}
                                  </td>

                                  <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-slate-600 dark:text-slate-400 truncate max-w-[200px] font-sans" title={row.remark}>
                                    {row.remark}
                                  </td>

                                  <td className="px-3 py-1.5 text-center">
                                    {row.hasData ? (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => setViewingPayment(row.originalPayment)}
                                          className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-all shadow"
                                          title="View Full Details / Audit logs"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setSelectedReceiptPayment(row.originalPayment)}
                                          className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-900 dark:hover:text-white border border-indigo-500/10 hover:border-transparent transition-all shadow"
                                          title="Generate Print Receipt"
                                        >
                                          <Printer className="h-3.5 w-3.5" />
                                        </button>
                                        {userRole === 'Admin' && (
                                          <button
                                            onClick={() => handleDeletePaymentClick(row.originalPayment)}
                                            className="p-1 rounded bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-transparent transition-all shadow active:scale-95"
                                            title="Delete Transaction Record"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-600 font-semibold text-[10px]">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}

                              {/* Summary formula row */}
                              <tr className="bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-[11px]">
                                <td className="border-r border-slate-300 dark:border-slate-800 text-center text-slate-500 bg-slate-100 dark:bg-slate-900 py-2.5">
                                  {getLast30DaysData(expandedPanelPayments).length + 2}
                                </td>
                                <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 uppercase tracking-wider text-slate-600 dark:text-slate-400 text-[9px]" colSpan="5">
                                  =SUM(E2:E{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(F2:F{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(G2:G{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(H2:H{getLast30DaysData(expandedPanelPayments).length + 1})
                                </td>
                                <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-amber-400 bg-amber-500/5">
                                  ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                                </td>
                                <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-orange-400 bg-orange-500/5">
                                  ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.billDiscount, 0).toLocaleString()}
                                </td>
                                <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-emerald-400 bg-emerald-500/5">
                                  ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.amountReceived, 0).toLocaleString()}
                                </td>
                                <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-rose-400 bg-rose-500/5">
                                  ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.paymentDiscount, 0).toLocaleString()}
                                </td>
                                {(() => {
                                  const netVal = getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + (r.billAmount - r.billDiscount) - (r.amountReceived + r.paymentDiscount), 0);
                                  return (
                                    <td className={`border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right transition-all ${netVal > 0 ? 'text-rose-400 bg-rose-500/5' : netVal < 0 ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 bg-slate-200/10 dark:bg-slate-800/10'}`}>
                                      {netVal < 0 ? `₹${Math.abs(netVal).toLocaleString()}` : `₹${netVal.toLocaleString()}`}
                                    </td>
                                  );
                                })()}
                                <td className="px-3 py-2.5 text-indigo-400 font-semibold italic text-[10px]" colSpan="2">
                                  Total Ledger Activity Summary
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tr>
          ))}

          {/* Grand Total summary row */}
          <tr className="bg-slate-200/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs">
            <td className="border-r border-slate-300 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 py-3 w-12">
              {panels.length + 1}
            </td>
            <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 uppercase tracking-wider text-slate-600 dark:text-slate-400 text-[10px]" colSpan="2">
              =SUM(C2:C{panels.length + 1}) ...
            </td>
            <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-slate-700 dark:text-slate-300">
              ₹{panels.reduce((sum, p) => sum + (p.openingBalance || 0), 0).toLocaleString()}
            </td>
            <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-slate-600 dark:text-slate-400" colSpan="3">
              Total Sheets Activity
            </td>
            <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-emerald-400 bg-emerald-500/5">
              ₹{panels.reduce((sum, p) => sum + (p.totalPaid || 0), 0).toLocaleString()}
            </td>
            <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-rose-400 bg-rose-500/5">
              ₹{panels.reduce((sum, p) => sum + (p.outstanding || 0), 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-indigo-400 text-center">
              All Clients Active Summary
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
