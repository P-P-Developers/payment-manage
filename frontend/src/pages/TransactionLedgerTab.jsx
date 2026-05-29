import {
  Search,
  Calendar,
  Eye,
  Trash2,
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
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 w-full bg-slate-100/10 dark:bg-slate-900/10 p-2.5 rounded-2xl border border-slate-900/40">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search panel client or category..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40"
          />
        </div>

        {/* Transaction Type Filter */}
        <div className="shrink-0">
          <select
            value={transactionTypeFilter}
            onChange={(e) => setTransactionTypeFilter(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-semibold"
          >
            <option value="all" className="bg-slate-100 dark:bg-slate-900">All Transactions</option>
            <option value="bill" className="bg-slate-100 dark:bg-slate-900">Bills Only</option>
            <option value="received" className="bg-slate-100 dark:bg-slate-900">Payments Only</option>
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 shrink-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onClick={(e) => e.target.showPicker()}
            className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs font-semibold"
          />
          <span className="text-slate-600 text-[9px] uppercase">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            onClick={(e) => e.target.showPicker()}
            className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs font-semibold"
          />
        </div>

        {/* Panel Category Filter */}
        <div className="shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-medium"
          >
            <option value="All" className="bg-slate-100 dark:bg-slate-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name} className="bg-slate-100 dark:bg-slate-900">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Charge Type Filter */}
        <div className="shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-medium"
          >
            <option value="All" className="bg-slate-100 dark:bg-slate-900">All Charges</option>
            {(paymentTypes.length > 0 ? paymentTypes : FALLBACK_PAYMENT_TYPES.map(name => ({ _id: name, name }))).map((pt) => (
              <option key={pt._id} value={pt.name} className="bg-slate-100 dark:bg-slate-900">{pt.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Mode Filter */}
        <div className="shrink-0">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-medium"
          >
            <option value="All" className="bg-slate-100 dark:bg-slate-900">All Modes</option>
            <option value="UPI" className="bg-slate-100 dark:bg-slate-900">UPI</option>
            <option value="Cash" className="bg-slate-100 dark:bg-slate-900">Cash</option>
            <option value="Bank Transfer" className="bg-slate-100 dark:bg-slate-900">Bank Transfer</option>
            <option value="Online" className="bg-slate-100 dark:bg-slate-900">Online</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {(startDate || endDate || transactionTypeFilter !== 'all' || typeFilter !== 'All' || modeFilter !== 'All' || categoryFilter !== 'All' || searchQuery) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setTransactionTypeFilter('all');
              setTypeFilter('All');
              setModeFilter('All');
              setCategoryFilter('All');
              setSearchQuery('');
            }}
            className="text-[10px] uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-all bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-2 rounded-xl shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-50/60 bgw light:bg-slate-950/60 border border-slate-300/80 dark:border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 text-center w-14">S.No</th>
                <th className="py-3.5 px-5">Date &amp; Time</th>
                <th className="py-3.5 px-5">Panel Client</th>
                <th className="py-3.5 px-5">Billing Type</th>
                <th className="py-3.5 px-5">Financial Details</th>
                <th className="py-3.5 px-5">Collected By</th>
                <th className="py-3.5 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {loading && payments.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredPayments.map((p, index) => (
                <tr key={p._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors duration-150 group">

                  {/* S.No */}
                  <td className="py-3 px-4 text-center font-mono text-slate-500">
                    {(currentPage - 1) * 10 + index + 1}
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {new Date(p.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>

                  {/* Panel Client */}
                  <td className="py-3 px-5">
                    <div className="flex items-start gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center text-[11px] capitalize shrink-0">
                        {p.panelId?.panelName?.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-wide max-w-[180px] break-words leading-snug">
                        {p.panelId?.panelName || 'Deleted Panel'}
                      </span>
                    </div>
                  </td>

                  {/* Billing Type */}
                  <td className="py-3 px-5">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${p.paymentType === 'License'
                          ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-800'
                          : p.paymentType === 'IP Charges'
                            ? 'bg-violet-500/10 text-violet-700 border border-violet-800'
                            : p.paymentType === 'Maintenance'
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-800'
                              : 'bg-emerald-500/10 text-emerald-700 border border-emerald-800'
                          }`}
                      >
                        {p.paymentType}
                      </span>
                      {(p.paymentType === 'License' || p.paymentType === 'IP Charges') &&
                        p.quantity !== undefined && p.quantity !== null &&
                        p.amountReceived < (p.billAmount - p.billDiscount) && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase ml-0.5">
                            Qty: {p.quantity}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Financial Details */}
                  <td className="py-3 px-5">
                    <div className="flex flex-col gap-1">
                      <div>
                        {p.amountReceived === 0 ? (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-rose-700/10 text-rose-700 border border-rose-700">
                            Unpaid
                          </span>
                        ) : p.amountReceived < (p.billAmount - p.billDiscount) ? (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-amber-700/10 text-amber-700 border border-amber-700">
                            Partial (₹{(p.billAmount - p.billDiscount - p.amountReceived).toLocaleString()} due)
                          </span>
                        ) : null}
                      </div>

                      {p.billAmount > 0 ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Bill:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-mono">₹{p.billAmount?.toLocaleString()}</span>
                          </div>
                          {p.billDiscount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Disc:</span>
                              <span className="text-amber-600 dark:text-amber-400 font-mono">₹{p.billDiscount?.toLocaleString()}</span>
                            </div>
                          )}
                          {p.amountReceived > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Paid:</span>
                              <span className={`font-extrabold font-mono ${p.amountReceived < (p.billAmount - p.billDiscount)
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                ₹{p.amountReceived?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Paid:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{p.amountReceived?.toLocaleString()}
                            </span>
                          </div>
                          {p.paymentDiscount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Disc:</span>
                              <span className="text-amber-600 dark:text-amber-400 font-mono">₹{p.paymentDiscount?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Collected By */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="font-medium truncate max-w-[110px]">
                        {p.addedBy?.name || 'Staff User'}
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingPayment(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs transition-all shadow-md active:scale-95"
                        title="View Full Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {userRole === 'Admin' && (
                        <button
                          onClick={() => handleDeletePaymentClick(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-transparent text-xs transition-all shadow-md active:scale-95"
                          title="Delete Transaction Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-600 dark:text-slate-400">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-100/40 dark:bg-slate-900/40 border-t border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Showing <span className="text-indigo-400">{filteredPayments.length}</span> of{' '}
            <span className="text-slate-900 dark:text-white">{totalPaymentsCount}</span> ledger entries
          </p>
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
        </div>
      </div>
    </>
  );
}
