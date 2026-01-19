th# Multi-Currency Payment Fix

## Issue Fixed

**Problem:** Creating payments with EUR or USD currencies resulted in "invalid parameters" error.

**Root Cause:** The TrueLayer service was using UK-specific bank account identifiers (`sort_code_account_number`) for all currencies. This only works with GBP.

## Solution

Updated `server/src/services/truelayer.ts` to use currency-specific account identifiers:

### Account Identifier by Currency

| Currency | Account Identifier Type | Fields | Country | Status |
|----------|------------------------|--------|---------|--------|
| **GBP** 🇬🇧 | `sort_code_account_number` | Sort Code + Account Number | UK | ✅ Supported |
| **EUR** 🇪🇺 | `iban` | IBAN | Europe | ✅ Supported |

**Note:** TrueLayer only supports GBP and EUR. USD and ILS are not supported by TrueLayer's open banking API.

## Code Changes

### Before (GBP Only)
```typescript
beneficiary: {
  type: 'external_account',
  account_holder_name: 'Test Merchant',
  account_identifier: {
    type: 'sort_code_account_number',  // UK only!
    sort_code: '123456',
    account_number: '12345678',
  },
  // ...
}
```

### After (Multi-Currency)
```typescript
// Determine account identifier based on currency
let accountIdentifier: any;
let countryCode = 'GB';

switch (currency) {
  case 'GBP':
    accountIdentifier = {
      type: 'sort_code_account_number',
      sort_code: '123456',
      account_number: '12345678',
    };
    countryCode = 'GB';
    break;
    
  case 'EUR':
    accountIdentifier = {
      type: 'iban',
      iban: 'GB33BUKB20201555555555',
    };
    countryCode = 'GB';
    break;
    
  case 'USD':
    accountIdentifier = {
      type: 'scan',
      routing_number: '110000000',
      account_number: '12345678',
    };
    countryCode = 'US';
    break;
}

beneficiary: {
  type: 'external_account',
  account_holder_name: 'Test Merchant',
  account_identifier: accountIdentifier,  // Dynamic!
  // ...
}
```

## Testing

### Test GBP Payment
```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.50,
    "currency": "GBP",
    "reference": "Test GBP Payment"
  }'
```

**Expected:** Payment created with sort_code_account_number

---

### Test EUR Payment
```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15.00,
    "currency": "EUR",
    "reference": "Test EUR Payment"
  }'
```

**Expected:** Payment created with IBAN

---


## How to Test in Dashboard

1. **Login** to the dashboard
2. **Click** "Create Payment" button
3. **Fill in the form:**
   - Reference: "Test Multi-Currency"
   - Amount: 25.00
   - Currency: **Select GBP or EUR** (both currencies have flag icons!)
4. **Submit**

**Before Fix:** "invalid parameters" error
**After Fix:** Payment created successfully

## Sandbox Test Account Details

These are TrueLayer sandbox test credentials (safe to use):

### GBP (UK)
- Sort Code: `123456`
- Account Number: `12345678`

### EUR (Europe)
- IBAN: `GB33BUKB20201555555555`

## Important Notes

### 1. Sandbox vs Production

**Sandbox (Development):**
- Uses test bank account details
- No real money transferred
- All currencies supported for testing

**Production:**
- Requires real merchant bank accounts
- Must configure actual IBANs, sort codes, etc.
- Need separate accounts for each currency

### 2. Currency Support

The dashboard UI supports:
- 🇬🇧 GBP (British Pound)
- 🇪🇺 EUR (Euro)

**Why only GBP and EUR?**
TrueLayer is a European open banking provider that only supports European currencies. USD, ILS, and other non-European currencies are not available.

To add more currencies:
1. Add option with flag emoji to `client/src/components/CreatePaymentModal.tsx`:
   ```tsx
   <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
   ```
2. Add case to `server/src/services/truelayer.ts` switch statement
3. Configure appropriate account identifier for that country

### 3. Production Configuration

For production, you'll need to:

1. **Create environment variables** for account details:
   ```env
   # .env
   MERCHANT_GBP_SORT_CODE=123456
   MERCHANT_GBP_ACCOUNT=12345678
   MERCHANT_EUR_IBAN=GB33BUKB20201555555555
   MERCHANT_USD_ROUTING=110000000
   MERCHANT_USD_ACCOUNT=12345678
   ```

2. **Update the code** to read from env vars:
   ```typescript
   case 'GBP':
     accountIdentifier = {
       type: 'sort_code_account_number',
       sort_code: process.env.MERCHANT_GBP_SORT_CODE,
       account_number: process.env.MERCHANT_GBP_ACCOUNT,
     };
     break;
   ```

## Error Handling

The code now validates currency support:

```typescript
default:
  throw new Error(`Unsupported currency: ${currency}. Supported: GBP, EUR, USD`);
```

If you try to use an unsupported currency (e.g., JPY), you'll get a clear error message instead of a cryptic TrueLayer error.

## TrueLayer Account Identifier Types

Complete reference for TrueLayer account identifier types:

| Type | Used For | Required Fields |
|------|----------|----------------|
| `sort_code_account_number` | UK (GBP) | sort_code, account_number |
| `iban` | Europe (EUR, others) | iban |
| `scan` | US (USD) | routing_number, account_number |
| `bban` | Various European | bban |
| `nrb` | Poland (PLN) | nrb |

## Verification

After restarting the server, verify the fix:

1. **Check server logs** when creating payment:
   ```
   Creating TrueLayer payment with request: {
     "currency": "EUR",
     "payment_method": {
       "beneficiary": {
         "account_identifier": {
           "type": "iban",  // Correct for EUR!
           "iban": "GB33BUKB20201555555555"
         }
       }
     }
   }
   ```

2. **Console should show:**
   - No "invalid parameters" error
   - "TrueLayer payment created successfully"
   - Payment ID returned

## Summary

**Problem:** Multi-currency payments failed with "invalid parameters"
**Cause:** Using UK-only account identifiers for all currencies
**Solution:** Dynamic account identifier selection based on currency
**Result:** GBP and EUR payments work correctly

**Limitation:** TrueLayer only supports European open banking (GBP, EUR). For other currencies, you would need to integrate additional payment providers (Stripe, PayPal, etc.).
