# TrueLayer Currency Limitations

## Supported Currencies

TrueLayer **only supports European open banking currencies**:

| Currency | Code | Status |
|----------|------|--------|
| 🇬🇧 British Pound | GBP | ✅ Fully Supported |
| 🇪🇺 Euro | EUR | ✅ Fully Supported |
| 🇵🇱 Polish Złoty | PLN | ⚠️ Requires Activation |
| 🇳🇴 Norwegian Krone | NOK | ✅ Supported |

## NOT Supported

TrueLayer does **NOT** support:

| Currency | Code | Reason |
|----------|------|--------|
| US Dollar | USD | Not in European open banking network |
| Israeli Shekel | ILS | Israel not in TrueLayer's supported countries |
| Japanese Yen | JPY | Not in European open banking network |
| Canadian Dollar | CAD | Not in European open banking network |
| Australian Dollar | AUD | Not in European open banking network |

## Why This Limitation?

TrueLayer is built on **European Open Banking regulations** (PSD2). This means:

1. **Geographic Limitation**: Only works with European banks
2. **Currency Limitation**: Only handles EUR, GBP, and select European currencies
3. **No US Banking**: US has different banking systems (ACH, Wire, etc.)
4. **No Israeli Banking**: Israel not part of European open banking

## What Was Removed from Dashboard

To avoid "invalid parameters" errors, we removed:
- ❌ USD (US Dollar) - Not supported by TrueLayer
- ❌ ILS (Israeli Shekel) - Not supported by TrueLayer

## If You Need Other Currencies

To support USD, ILS, or other non-European currencies, you need to integrate additional payment providers:

### Option 1: Stripe
- **Supports:** 135+ currencies worldwide
- **Integration:** Moderate complexity
- **Fees:** 2.9% + $0.30 per transaction
- **Best for:** Global payments
- **Docs:** https://stripe.com/docs

### Option 2: PayPal
- **Supports:** 25 currencies
- **Integration:** Easy
- **Fees:** ~3% per transaction
- **Best for:** Consumer payments
- **Docs:** https://developer.paypal.com/

### Option 3: Wise (TransferWise)
- **Supports:** 50+ currencies
- **Integration:** Moderate
- **Fees:** 0.5-2% (lower than most)
- **Best for:** International transfers
- **Docs:** https://wise.com/gb/business/

### Option 4: Adyen
- **Supports:** 150+ currencies
- **Integration:** Complex (enterprise)
- **Fees:** Varies by region
- **Best for:** Large businesses
- **Docs:** https://docs.adyen.com/

## Multi-Provider Architecture

If you need multiple currencies, the recommended approach is:

```typescript
// Pseudo-code
if (currency === 'GBP' || currency === 'EUR') {
  // Use TrueLayer
  paymentProvider = trueLayerService;
} else if (currency === 'USD' || currency === 'ILS') {
  // Use Stripe
  paymentProvider = stripeService;
} else {
  throw new Error('Currency not supported');
}
```

This way you can support:
- **European currencies** → TrueLayer (lower fees, open banking)
- **Other currencies** → Stripe/PayPal (higher fees, global support)

## Current Dashboard Status

**Currencies Available:** GBP 🇬🇧 and EUR 🇪🇺 only

**Why?** These are the only currencies TrueLayer supports without additional configuration.

**Future Expansion:** To add more currencies, integrate Stripe or another global payment provider.

## Testing

When testing, only use:
- ✅ GBP (will work)
- ✅ EUR (will work)
- ❌ USD (will fail with "invalid parameters")
- ❌ ILS (will fail with "invalid parameters")
- ❌ Any other currency (will fail)

## Error Messages

If you try to use an unsupported currency, you'll see:

**Frontend validation:** Currency dropdown only shows GBP and EUR

**Backend validation:** 
```
Error: Unsupported currency: USD. TrueLayer only supports: GBP, EUR
```

## Summary

**TrueLayer Strength:** European payments, open banking, lower fees
**TrueLayer Limitation:** Only European currencies (GBP, EUR)
**Solution:** Use TrueLayer for Europe, integrate Stripe for rest of world

Your dashboard is now configured to only show currencies that actually work with TrueLayer.
