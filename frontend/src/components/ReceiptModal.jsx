import { useRef } from 'react';
import { Printer, X, Download, ShieldCheck, Mail, Calendar, CreditCard, User, Tag } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, payment }) {
  const printAreaRef = useRef(null);

  if (!isOpen || !payment) return null;

  // Get system settings from localStorage
  let settings = {
    orgName: 'Deepmind Infotech',
    contactEmail: 'billing@deepmindinfotech.com',
    supportPhone: '+91 9876543210',
    logo: '',
    stamp: '',
  };
  try {
    const saved = localStorage.getItem('app_system_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.orgName) settings.orgName = parsed.orgName;
      if (parsed.contactEmail) settings.contactEmail = parsed.contactEmail;
      if (parsed.supportPhone) settings.supportPhone = parsed.supportPhone;
      if (parsed.logo) settings.logo = parsed.logo;
      if (parsed.stamp) settings.stamp = parsed.stamp;
    }
  } catch (e) {
    console.error('Failed to load settings in ReceiptModal', e);
  }

  const handlePrint = () => {
    // 1. Remove any previous receipt print iframe if exists
    const existingIframe = document.getElementById('receipt-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    // 2. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-iframe';
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';

    document.body.appendChild(iframe);

    const printContent = printAreaRef.current.innerHTML;

    // 3. Setup iframe document
    const iframeDoc = iframe.contentWindow || iframe.contentDocument;
    const doc = iframeDoc.document || iframeDoc;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Receipt_REC-${payment._id?.substring(18).toUpperCase()}</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 10mm;
              }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 20px;
              line-height: 1.5;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              border: 2px dashed #cbd5e1;
              padding: 30px;
              position: relative;
              background-color: #ffffff;
            }
            
            /* High-Contrast Print Overrides to ignore dark mode Tailwind colors */
            * {
              color: #1e293b !important;
              border-color: #e2e8f0 !important;
              background-color: transparent !important;
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
            
            .text-white, h1, p.font-bold {
              color: #0f172a !important;
            }
            .text-indigo-400 {
              color: #4f46e5 !important;
            }
            .text-emerald-400 {
              color: #10b981 !important;
            }
            .text-rose-400 {
              color: #ef4444 !important;
            }
            .text-slate-400, .text-slate-500 {
              color: #64748b !important;
            }
            
            /* Logo & Stamp sizing for print output */
            .print-logo {
              max-height: 55px;
              width: auto;
              margin-bottom: 8px;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            .print-stamp {
              max-height: 65px;
              width: auto;
              margin-bottom: 4px;
              display: block;
              margin-left: auto;
              margin-right: auto;
            }
            
            /* Stamp Overlays styling */
            .absolute {
              position: absolute !important;
            }
            .top-1\\/2 {
              top: 50% !important;
            }
            .left-1\\/2 {
              left: 50% !important;
            }
            .-translate-x-1\\/2 {
              transform: translate(-50%, -50%) rotate(-12deg) !important;
            }
            .border-4 {
              border-width: 4px !important;
              border-style: solid !important;
            }
            .border-emerald-500\\/20 {
              border-color: rgba(16, 185, 129, 0.25) !important;
              color: rgba(16, 185, 129, 0.25) !important;
            }
            .border-amber-500\\/20 {
              border-color: rgba(245, 158, 11, 0.25) !important;
              color: rgba(245, 158, 11, 0.25) !important;
            }
            .border-rose-500\\/20 {
              border-color: rgba(239, 68, 68, 0.25) !important;
              color: rgba(239, 68, 68, 0.25) !important;
            }
            
            /* Layout corrections */
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
            .gap-4 { gap: 16px !important; }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .justify-center { justify-content: center !important; }
            .justify-between { justify-content: space-between !important; }
            .w-full { width: 100% !important; }
            .w-64 { width: 256px !important; }
            
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              padding: 8px !important;
              border-bottom: 1px solid #e2e8f0 !important;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // 4. Wait for resources to load and trigger the print dialog
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  const receiptId = `REC-${payment._id?.substring(18).toUpperCase()}`;
  const timestamp = new Date(payment.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isFullyPaid = payment.billAmount === 0 || payment.amountReceived >= payment.billAmount;
  const isPartiallyPaid = payment.billAmount > 0 && payment.amountReceived > 0 && payment.amountReceived < payment.billAmount;
  const isCreditOnly = payment.billAmount > 0 && payment.amountReceived === 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-2xl glass-card p-6 md:p-8 border border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Printer className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Receipt Generator</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{receiptId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 text-xs font-bold border border-slate-700 transition-all shadow-md"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="h-8.5 w-8.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-transparent hover:border-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable/Preview Receipt Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div
            ref={printAreaRef}
            className="p-8 rounded-2xl bg-white border border-slate-200 relative overflow-hidden shadow-xl text-slate-800 font-sans"
          >
            {/* Stamp Overlay */}
            {isFullyPaid && (
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-emerald-500/20 text-emerald-500/20 text-5xl font-black uppercase py-2.5 px-8 rounded-2xl tracking-[0.25em] z-0 select-none pointer-events-none">
                PAID
              </div>
            )}
            {isPartiallyPaid && (
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-amber-500/20 text-amber-500/20 text-5xl font-black uppercase py-2.5 px-8 rounded-2xl tracking-[0.1em] z-0 select-none pointer-events-none">
                PART PAID
              </div>
            )}
            {isCreditOnly && (
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-rose-500/20 text-rose-500/20 text-5xl font-black uppercase py-2.5 px-8 rounded-2xl tracking-[0.2em] z-0 select-none pointer-events-none">
                DUE
              </div>
            )}

            {/* Receipt Content */}
            <div className="relative z-10 space-y-6">

              {/* Receipt Header */}
              <div className="text-center pb-6 border-b border-slate-200 flex flex-col items-center justify-center gap-2">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="h-16 w-auto object-contain mb-2 rounded-xl p-1 border border-slate-100 bg-slate-50" />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md mb-2">
                    {settings.orgName?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">{settings.orgName}</h1>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-2 bg-indigo-50 px-3.5 py-1 rounded-full inline-block">Official Transaction Receipt</p>
                </div>
              </div>

              {/* Meta Grid Info */}
              <div className="grid grid-cols-2 gap-6 text-xs py-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Transaction Date</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{timestamp}</p>
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>Receipt No</span>
                  </div>
                  <p className="font-mono font-extrabold text-indigo-600 text-sm uppercase">{receiptId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-xs pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Client (Bill To)</span>
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm leading-tight">{payment.panelId?.panelName || 'Deleted Panel Client'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Owner: {payment.panelId?.ownerName || '-'}</p>
                </div>

                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <span>Payment Method</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{payment.amountReceived > 0 ? payment.paymentMode : '-'}</p>
                  {payment.amountReceived > 0 && payment.bankName && <p className="text-[10px] text-slate-500 font-semibold">{payment.bankName}</p>}
                </div>
              </div>

              {/* Charge Item Table */}
              <div className="pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-3 rounded-l-lg">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Rate</th>
                      <th className="p-3 text-right rounded-r-lg">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block text-sm">{payment.paymentType} Fees</span>
                        <span className="text-[10px] text-slate-400 font-medium">Software Panel Charge Module</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-slate-800 text-sm">
                        {payment.paymentType === 'License' || payment.paymentType === 'IP Charges' ? payment.quantity || 1 : '1'}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-500 text-sm">
                        ₹{(payment.unitPrice || (payment.billAmount || payment.amountReceived)).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900 font-mono text-sm">
                        ₹{(payment.billAmount > 0 ? payment.billAmount : payment.amountReceived).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="w-64 space-y-2.5 text-xs bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  {payment.billAmount > 0 && (
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Invoice Total (Bill):</span>
                      <span className="font-bold text-slate-700">₹{payment.billAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {payment.billDiscount > 0 && (
                    <div className="flex justify-between text-orange-650 font-semibold">
                      <span>Bill Discount:</span>
                      <span className="font-bold text-orange-600">-₹{payment.billDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-200/60 pt-2.5">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-600 text-base">₹{payment.amountReceived.toLocaleString()}</span>
                  </div>

                  {payment.paymentDiscount > 0 && (
                    <div className="flex justify-between text-rose-650 font-semibold">
                      <span>Payment Discount:</span>
                      <span className="font-bold text-rose-600">-₹{payment.paymentDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {payment.billAmount > 0 && (
                    <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-xs">
                      <span className="text-slate-500 font-semibold">Balance Due:</span>
                      {(() => {
                        const due = (payment.billAmount - (payment.billDiscount || 0)) - (payment.amountReceived + (payment.paymentDiscount || 0));
                        return (
                          <span className={`font-extrabold ${due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            ₹{due.toLocaleString()}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-6 border-t border-slate-200 mt-6 flex flex-col items-center justify-center gap-3">
                {settings.stamp && (
                  <div className="mb-1 flex flex-col items-center justify-center">
                    <img src={settings.stamp} alt="Authorized Sign" className="h-14 w-auto object-contain print-stamp" />
                    <span className="text-[8px] text-slate-400 block mt-1 tracking-wider uppercase font-extrabold">(Authorized Signatory & Stamp)</span>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    Verified by <span className="text-slate-800 font-bold">{payment.addedBy?.name || 'Staff User'}</span> • {settings.orgName}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Thank you for your business!</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-5 py-2.5 text-xs font-bold transition-colors border border-slate-700"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
}
