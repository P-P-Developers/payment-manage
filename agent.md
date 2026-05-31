# Developer Handbook & Codebase Guide (`agent.md`)

Welcome! This guide outlines the design, architecture, key workflows, and recent features of the **Payment & Accounting Management System** for Panel Software Sales. Reading this handbook will enable any developer or AI assistant to understand the codebase immediately and make changes with absolute confidence.

---

## 1. Project Overview & Architecture
This application manages billing, transaction ledgers, statements, and automated communications for panel software clients. It is structured as a fullstack application:

- **Backend (`server/`)**: Built on Node.js, Express, and Mongoose (MongoDB). Uses standard middleware, authentication rules, and nodemon for hot-reloads.
- **Frontend (`frontend/`)**: Built on React, Vite, React Router, TailwindCSS, and Lucide React icons.

---

## 2. Key Database Models (`server/models/`)

### A. Panel Model (`models/Panel.js`)
Represents a client's panel configuration and charging rates.
- `panelName`: String (Unique)
- `ownerName`, `ownerEmail`, `phoneNumber`: Billing and contact details.
- `licenseCharges`, `ipCharges`, `maintenanceCharges`: Standard pricing defaults for periodic billing.
- `openingBalance`: Initial outstanding or advance balance at setup.
- `gstNumber` [NEW]: String field storing the client's GSTIN, printed automatically in receipts and statements.

### B. Payment Model (`models/Payment.js`)
Stores both generated bills (Debit invoices) and collected payments (Credit deposits).
- `panelId`: Populated reference to a `Panel`.
- `billAmount` / `amountReceived`: Financial figures determining whether a record is a bill or a payment.
- `paymentType`: `License`, `IP Charges`, `Maintenance`, `Setup Cost`, or `Advance`.
- `paymentMode`: `Cash`, `UPI`, `Bank Transfer`, or `Online`.
- `bankName`: Specific bank (e.g. "HDFC") or payment gateway.
- `status`: `Unpaid`, `Partial`, or `Paid`.

---

## 3. Core Backend Services & Routes (`server/`)

### A. Dynamic PDF Receipt Generator (`server/utils/pdfGenerator.js`)
Creates professional, pixel-perfect transaction receipts in-memory using `pdfkit`.
- **Base64 Decodes Logos & Stamps**: Implements `convertBase64ToBuffer()` to decode base64 strings passed from the frontend `localStorage` (via the API request body).
- **Responsive Branding**: If a custom logo exists, it prints it at the top; otherwise, it falls back to the text organization name.
- **Official Stamp Integration**: If a custom signature/stamp is saved, it renders the stamp at the footer overlay accompanied by `(AUTHORIZED SIGNATORY & STAMP)`.
- **4-Column Matching Table**: Renders columns for `DESCRIPTION`, `QTY`, `UNIT RATE`, and `AMOUNT` to match the exact frontend receipt UI.
- **Status Badges**: Renders a clean boxed status stamp (`PAID`, `PART PAID`, or `DUE`) based on outstanding payments.

### B. SMTP Email Route (`server/routes/smtp.js`)
Sends out transactional invoice statements via NodeMailer.
- **Dynamic PDF Attachments**: Upon triggering `/send-bill`, it generates the receipt PDF in-memory, passes the buffer to `sendNodemailerEmail` under `attachments`, and delivers a rich HTML billing template with the printable PDF receipt attached.

### C. WhatsApp Meta Cloud API Route (`server/routes/whatsapp.js`)
Integrates the official Meta Graph Cloud API.
- **Meta Media Upload Integration**: Solves the "local development file sharing restriction" by uploading the generated PDF buffer directly to Meta's media endpoint (`https://graph.facebook.com/v19.0/{phone-id}/media`) via native `FormData` multipart payloads.
- **Dynamic Document Delivery**: Dispatches a `document` type message to the client's phone containing the official PDF receipt (`media_id`).
- **Secondary Summary Text**: Dispatches a `text` type summary message immediately after so the client gets both the PDF file and the inline summary.
- **Strict Sandbox Bypass**: Bypasses Graph API calls only if the exact developer sandbox credentials (`105658249673952` Phone ID and the dummy token) are used. Production tokens starting with `EAAGb8` hit the real Meta API cleanly.

---

## 4. Key Frontend Pages & Components (`frontend/src/`)

### A. Receipt Generator Modal (`components/ReceiptModal.jsx`)
Exposes printing, WhatsApp Web, and automated API features inside a gorgeous modal.
- **Glassmorphism Backdrop & Loader**: Integrates a highly premium backdrop blur overlay and `Loader2` spinning indicator when `sharing` is active, locking input and preventing double clicks while the PDF uploads.
- **API Payloads**: Forwards custom browser `settings` (containing the base64 logo and stamp) to the backend so the server can generate the branded PDF.
- **Proportional Width**: Styled with a comfortable `max-w-2xl` width for optimal desktop spacing and table layout breathing room.

### B. Clients Management Page (`pages/Panels.jsx`)
Enables administrators to create and edit clients.
- **GST Number Input**: Features a dynamic input field styled with `Tag` icons to add or edit a panel's GST Number (automatically capitalized).

### C. Client Ledger & Transactions (`pages/PanelLedger.jsx`)
Displays a client's chronological debit/credit statements.
- **Vibrant Dark-Theme Badges**: Uses customized HSL gradient dark borders and subtle glassmorphic backgrounds for charge types (`License`, `IP Charges`, etc.) to ensure elegant text contrast in dark theme.
- **Standard Colors Bug Fix**: Resolves browser-select bugs by utilizing 100% standard Tailwind CSS colors (`bg-slate-100 dark:bg-slate-800` & `text-slate-600 dark:text-slate-350`) for the payment mode/bank badge in the `MODE` column.

### D. Statement Passbook Page (`pages/Statement.jsx`)
Generates bank-style account statements with computed deposits, debits, and running balances.
- **Hidden Iframe Printer**: Generates a gorgeous, dedicated bank-passbook style A4 layout in a hidden iframe when `Print Passbook` is clicked, bypassing browser navbars, filters, and dark mode background fills. Prints a clean, branded statement sheet with Client Details, Period Summary, and aggregates.

---

## 5. Guide for Making Future Changes

### To Add a New Charge Category:
1. Update `CHARGE_TYPE_STYLES` at the top of [PanelLedger.jsx](file:///e:/payment-manage/frontend/src/pages/PanelLedger.jsx) with custom light and dark gradient tokens.
2. Register the category default inside [Panels.jsx](file:///e:/payment-manage/frontend/src/pages/Panels.jsx) billing defaults section.

### To Customize PDF Styles:
1. Go to [pdfGenerator.js](file:///e:/payment-manage/server/utils/pdfGenerator.js).
2. Modify the coordinates of elements (`doc.text()`, `doc.rect()`, `doc.moveTo()`).
3. Note that standard points in A4 PDF are `72 points per inch` (A4 size is `595 x 842` points).

### To Test WhatsApp Sandbox:
1. Populate these mock values in `Settings`:
   - **Phone Number ID**: `105658249673952`
   - **Access Token**: `EAAGb8ZCpZBZCQM0BAHR1KZCZAyp1Xb71v89k82S74mXl35p21z986a7d5c3e9f8h2j5k1m0n3o2p1q4r7s0t8u6v5w2x1y5z`
2. This triggers the backend bypass check in `whatsapp.js` cleanly without invoking Meta.
