# External API Date Key Rules

When syncing data from external APIs into the `payment-manage` local database (whether during cron jobs or manual sync checks), **always strictly use the following specific date keys** from the API responses. DO NOT use fallback keys (like `item.date || item.createdAt`), as it can result in incorrect UTC offset groupings or timezone mismatch issues.

## 1. IPHub API (IP Billing)
- Endpoint: `https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary` (Manual Check)
  - Key to use: `createdAt`
- Endpoint: `https://iphub.deepmindinfotech.com/backend/admin/ip/billing-summary-today` (Daily Cron)
  - Key to use: `createdAt`

## 2. Tradestreet SOP Tools (SOP Licenses)
- Endpoint: `https://soptools.tradestreet.in/superbackend/AmmountDetailsFilter` (Manual Check)
  - Key to use: `Payment Date`
- Endpoint: `https://soptools.tradestreet.in/superbackend/TodayAmountDetails` (Daily Cron)
  - Key to use: `Payment Date`

## 3. Deepmindinfotech New Penal (SmartAlgo Licenses)
- Endpoint: `https://newpenal.deepmindinfotech.com/backend/getall/history` (Used in both)
  - Key to use: `createdAt`

**Action Item:** If you are asked to write or modify any sync scripts for these APIs, strictly extract the date using the specified keys above before converting it into a JS `Date` object for the database `timestamp`.
