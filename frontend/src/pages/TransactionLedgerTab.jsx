import {
  Search,
  Calendar,
  Eye,
  Trash2,
  X,
} from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-3 px-4">
      <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3.5 w-24 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4.5 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3.5 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4 w-28 rounded bg-slate-200/50 dark:bg-slate-800/50"></div>
    </td>
    <td className="py-3 px-4">
      <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

export default function TransactionLedgerTab({
  // data
  payments,
  loading,
  categories,
  paymentTypes,
  currentPage,
  totalPages,
  totalPaymentsCount,
  // filters
  searchQuery,
  setSearchQuery,
  transactionTypeFilter,
  setTransactionTypeFilter,
  showDuplicates,
  setShowDuplicates,
  discountOnly,
  setDiscountOnly,
  gstOnly,
  setGstOnly,
  advanceOnly,
  setAdvanceOnly,
  unpaidOnly,
  setUnpaidOnly,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  categoryFilter,
  setCategoryFilter,
  typeFilter,
  setTypeFilter,
  modeFilter,
  setModeFilter,
  // pagination
  setCurrentPage,
  pageSize,
  setPageSize,
  // actions
  setViewingPayment,
  handleDeletePaymentClick,
  userRole,
  // constants
  FALLBACK_PAYMENT_TYPES,
}) {
  const filteredPayments = payments;

  return (
    <>
      {/* Redesigned Filters Bar */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-3.5 shadow-sm mb-4">
        
        {/* Top Row: Search and Date Range */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, owner, remarks..."
              className="w-full rounded-lg pl-10 pr-4 py-2 text-[13px] bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner"
            />
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-1.5 shrink-0 transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 shadow-inner">
            <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[110px] bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer text-[12px] font-semibold [color-scheme:light] dark:[color-scheme:dark]"
            />
            <span className="text-slate-300 dark:text-slate-600 font-bold px-1">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[110px] bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer text-[12px] font-semibold [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Bottom Row: Dropdowns and Toggles */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          
          {/* Dropdowns Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="rounded-md px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="all">All Transactions</option>
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="bill">Bills Only</option>
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="received">Payments Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="All">All Categories</option>
              {categories.map((cat) => (
                <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="All">All Charges</option>
              {(paymentTypes.length > 0 ? paymentTypes : FALLBACK_PAYMENT_TYPES.map(name => ({ _id: name, name }))).map((pt) => (
                <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" key={pt._id} value={pt.name}>{pt.name}</option>
              ))}
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="rounded-md px-3 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer font-semibold hover:border-slate-300 dark:hover:border-slate-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            >
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="All">All Modes</option>
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="CASH">Cash</option>
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="UPI">UPI</option>
              <option className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold" value="BANK_TRANSFER">Bank</option>
            </select>
          </div>

          {/* Toggles Group */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={showDuplicates}
                  onChange={(e) => setShowDuplicates(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-600 dark:focus:ring-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] font-bold">Duplicates</span>
              </label>
              
              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700"></div>

              <label className="flex items-center gap-1.5 cursor-pointer text-orange-700 dark:text-orange-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-orange-300 dark:border-orange-600/50 text-orange-500 focus:ring-orange-500 dark:focus:ring-orange-400 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] font-bold">Discounted</span>
              </label>

              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700"></div>

              <label className="flex items-center gap-1.5 cursor-pointer text-fuchsia-700 dark:text-fuchsia-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={gstOnly}
                  onChange={(e) => setGstOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-fuchsia-300 dark:border-fuchsia-600/50 text-fuchsia-500 focus:ring-fuchsia-500 dark:focus:ring-fuchsia-400 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] font-bold">GST</span>
              </label>

              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700"></div>

              <label className="flex items-center gap-1.5 cursor-pointer text-blue-700 dark:text-blue-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={advanceOnly}
                  onChange={(e) => setAdvanceOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-blue-300 dark:border-blue-600/50 text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] font-bold">Advance</span>
              </label>

              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700"></div>

              <label className="flex items-center gap-1.5 cursor-pointer text-red-700 dark:text-red-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={unpaidOnly}
                  onChange={(e) => setUnpaidOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-red-300 dark:border-red-600/50 text-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-[11px] font-bold">Unpaid</span>
              </label>
            </div>

            {/* Reset Button */}
            {(startDate || endDate || transactionTypeFilter !== 'all' || typeFilter !== 'All' || modeFilter !== 'All' || categoryFilter !== 'All' || searchQuery || showDuplicates || discountOnly || gstOnly || advanceOnly || unpaidOnly) && (
              <button
                onClick={() => {
                  setStartDate(''); setEndDate(''); setTransactionTypeFilter('all');
                  setTypeFilter('All'); setModeFilter('All'); setCategoryFilter('All'); setSearchQuery('');
                  setShowDuplicates(false); setDiscountOnly(false); setGstOnly(false); setAdvanceOnly(false); setUnpaidOnly(false);
                }}
                className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-all border border-rose-200 dark:border-rose-500/20 hover:border-transparent shadow-sm h-[32px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-surface  border-border-primary overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-bg-secondary border-b border-border-primary text-text-secondary uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center w-14">S.No</th>
                <th className="py-3 px-5">Date &amp; Time</th>
                <th className="py-3 px-5">Panel Client</th>
                <th className="py-3 px-5">Billing Type</th>
                <th className="py-3 px-5">Financial Details</th>
                <th className="py-3 px-5">Collected By</th>
                <th className="py-3 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary text-text-primary">
              {loading && payments.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredPayments.map((p, index) => (
                <tr key={p._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors duration-150 group">

                  {/* S.No */}
                  <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {pageSize === 'all' ? index + 1 : (currentPage - 1) * pageSize + index + 1}
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {new Date(p.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                        {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* Panel Client */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold capitalize shrink-0 shadow-sm">
                        {p.panelId?.panelName?.substring(0, 2)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wide max-w-[180px] break-words leading-tight capitalize">
                          {p.panelId?.panelName || 'Deleted Panel'}
                        </span>
                        {p.panelId?.status === 'Stopped' && (
                          <span className="w-fit px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 tracking-wider">
                            Stopped
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Billing Type */}
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-extrabold border ${p.paymentType === 'License'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : p.paymentType === 'IP Charges'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : p.paymentType === 'Maintenance'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                      >
                        {p.paymentType}
                      </span>
                      {(p.paymentType === 'License' || p.paymentType === 'IP Charges') &&
                        p.quantity !== undefined && p.quantity !== null && p.quantity > 0 && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-0.5">
                            Qty: {p.quantity}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Financial Details */}
                  <td className="py-4 px-5">
                    <div className="flex flex-col gap-1.5">
                      <div>
                        {p.amountReceived === 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                            Unpaid
                          </span>
                        ) : p.amountReceived < (p.billAmount - p.billDiscount) ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            Partial (₹{(p.billAmount - p.billDiscount - p.amountReceived).toLocaleString()} due)
                          </span>
                        ) : p.billAmount > 0 ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25">
                            Direct Pay
                          </span>
                        )}
                      </div>

                      {p.billAmount > 0 ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider w-8">Bill:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-semibold font-mono">₹{p.billAmount?.toLocaleString()}</span>
                          </div>
                          {(() => {
                            const hasGst = p.isGstApplied === true;
                            if (hasGst && p.billAmount > 0) {
                              const base = p.billAmount / 1.18;
                              const gstAmt = p.billAmount - base;
                              return (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-fuchsia-500/80 dark:text-fuchsia-400/80 font-bold uppercase tracking-wider w-8">GST:</span>
                                  <span className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold font-mono text-[9px]">
                                    (Inc. ₹{Math.round(gstAmt).toLocaleString()})
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {p.billDiscount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider w-8 text-rose-500/80">Disc:</span>
                              <span className="text-rose-500 dark:text-rose-400 font-semibold font-mono">-₹{p.billDiscount?.toLocaleString()}</span>
                            </div>
                          )}
                          {p.amountReceived > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider w-8">Paid:</span>
                              <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                ₹{p.amountReceived?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider w-8">Paid:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{p.amountReceived?.toLocaleString()}
                            </span>
                          </div>

                          {p.paymentDiscount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider w-8 text-rose-500/80">Disc:</span>
                              <span className="text-rose-500 dark:text-rose-400 font-semibold font-mono">-₹{p.paymentDiscount?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Collected By */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] uppercase font-bold border border-slate-300 dark:border-slate-700">
                        {p.addedBy?.name?.substring(0, 2) || 'ST'}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {p.addedBy?.name || 'Staff User'}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingPayment(p)}
                        className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-[#0A2540] dark:bg-slate-800 dark:hover:bg-[#0A2540] text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700/60 transition-all duration-200 shadow-sm active:scale-95"
                        title="View Full Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {userRole === 'Admin' && (
                        <button
                          onClick={() => handleDeletePaymentClick(p)}
                          className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200/50 dark:border-rose-900/50 hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                          title="Delete Transaction Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="py-12">
                    <div className="flex flex-col items-center justify-center">
                      {/* No Data Icon */}
                      <div className="relative w-28 h-28 mb-5">
                        <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-800"></div>

                        <div className="absolute inset-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-900">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 7h18M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm3 8h4m-4 4h6"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Text */}
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                        No Payments Found
                      </h3>

                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center">
                        There are no payment records available yet.
                        New payments will appear here once they are added.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-bg-secondary border-t border-border-primary flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Showing <span className="text-indigo-400">{filteredPayments.length}</span> of{' '}
              <span className="text-slate-900 dark:text-white">{totalPaymentsCount}</span> ledger entries
            </p>

            {/* Page Size Select */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 shadow-sm">
              <span className="font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide shrink-0 text-[10px]">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'all' ? 'all' : Number(val));
                }}
                className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 font-semibold cursor-pointer outline-none text-xs p-0"
              >
                <option value={10} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">10 rows</option>
                <option value={25} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">25 rows</option>
                <option value={50} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">50 rows</option>
                <option value={100} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">100 rows</option>
                <option value="all" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">All Pages</option>
              </select>
            </div>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-300 dark:border-slate-700"
              >
                Previous
              </button>
              <span className="text-slate-600 dark:text-slate-400 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-300 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
