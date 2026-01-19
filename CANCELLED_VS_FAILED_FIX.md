# Fix: Cancelled vs Failed Payment Status

## Issue Fixed ✅

**Problem:** When a user cancelled a payment during the payment flow (by clicking "Cancel" on the final stage), the payment was marked as `failed` instead of `cancelled`.

**User Question:** "When I press on cancel in the last stage of the payment, I have a failed status. Why is that? Is that what we want?"

**Answer:** No! Cancelled and failed are different things that should be treated differently.

---

## Understanding TrueLayer Status

### TrueLayer API v3 Behavior

TrueLayer doesn't have a direct `cancelled` status. Instead:

- **Status field:** Returns `failed` for both actual failures AND cancellations
- **failure_reason field:** Contains the reason:
  - `"canceled"` or `"cancelled"` = Merchant/API cancellation
  - `"user_canceled_at_provider"` or `"user_cancelled_at_provider"` = User cancelled via bank UI
  - Other reasons = Actual failures (e.g., `"insufficient_funds"`, `"provider_error"`, etc.)

---

## The Solution

### 1. Added `cancelled` Status Type

**Both frontend and backend:**
```typescript
export type PaymentStatus = 
  | 'authorization_required'
  | 'authorizing'
  | 'authorized'
  | 'failed'
  | 'executed'
  | 'settled'
  | 'cancelled';  // NEW!
```

---

### 2. Added `failure_reason` to TrueLayer Response Type

**Backend type definition:**
```typescript
export interface TrueLayerPaymentResponse {
  id: string;
  amount_in_minor: number;
  currency: string;
  // ... other fields
  status: PaymentStatus;
  failure_reason?: string;  // NEW! e.g., "canceled", "user_canceled_at_provider"
  failure_stage?: string;   // NEW! Stage at which failure occurred
}
```

---

### 3. Created Smart Status Mapping Function

**Backend (`server/src/routes/payments.ts`):**
```typescript
/**
 * Helper function to map TrueLayer payment response to our internal status
 * Distinguishes between cancelled and failed payments
 */
function mapPaymentStatus(trueLayerPayment: TrueLayerPaymentResponse): PaymentStatus {
  // If status is 'failed', check failure_reason to see if it was cancelled
  if (trueLayerPayment.status === 'failed' && trueLayerPayment.failure_reason) {
    const cancelledReasons = [
      'canceled', 
      'cancelled', 
      'user_canceled_at_provider', 
      'user_cancelled_at_provider'
    ];
    
    if (cancelledReasons.includes(trueLayerPayment.failure_reason.toLowerCase())) {
      return 'cancelled';  // Map to our cancelled status
    }
  }
  
  return trueLayerPayment.status;  // Return as-is for other statuses
}
```

**How it works:**
```
TrueLayer Returns:
  status: "failed"
  failure_reason: "user_canceled_at_provider"
  
Our Mapping:
  → Status becomes: "cancelled" ✅
  
TrueLayer Returns:
  status: "failed"
  failure_reason: "insufficient_funds"
  
Our Mapping:
  → Status stays: "failed" ✅
```

---

### 4. Updated All Status Checks

**Applied mapping in 3 places:**

#### A. Creating Payment (POST /api/payments)
```typescript
const payment: Payment = {
  // ...
  status: mapPaymentStatus(trueLayerPayment),  // ← Use mapper
  // ...
};
```

#### B. Refreshing Status (POST /api/payments/:id/refresh-status)
```typescript
const mappedStatus = mapPaymentStatus(trueLayerPayment);
if (mappedStatus !== originalStatus) {
  // Status changed, update database
  await paymentsRepo.updatePaymentStatus(userId, paymentId, mappedStatus, trueLayerPayment);
}
```

#### C. Getting Payment (GET /api/payments/:id)
```typescript
const trueLayerPayment = await trueLayerService.getPayment(paymentId);
const mappedStatus = mapPaymentStatus(trueLayerPayment);
if (mappedStatus !== payment.status) {
  // Update with mapped status
  await paymentsRepo.updatePaymentStatus(userId, paymentId, mappedStatus, trueLayerPayment);
}
```

---

### 5. Updated Frontend Display

#### A. Added Yellow "Cancelled" Badge
```css
/* PaymentDetail.module.css & PaymentsList.module.css */
.statusCancelled {
  background-color: #fef3c7;  /* Light yellow/amber */
  color: #92400e;              /* Dark brown/amber */
}
```

#### B. Added Cancelled Card in Payment Detail
```typescript
{payment.status === 'cancelled' && (
  <div style={{ 
    backgroundColor: '#fefce8',  // Light yellow
    borderColor: '#fde047'       // Yellow border
  }}>
    <svg>⚠️ X icon (yellow)</svg>
    <div>
      <h2>Payment Cancelled</h2>
      <p>This payment was cancelled. Create a new payment if you'd like to try again.</p>
    </div>
  </div>
)}
```

#### C. Updated Status Filter
```typescript
<select>
  <option value="all">All Statuses</option>
  <option value="authorization_required">Authorization Required</option>
  <option value="authorizing">Authorizing</option>
  <option value="authorized">Authorized</option>
  <option value="executed">Executed</option>
  <option value="cancelled">Cancelled</option>  {/* NEW! */}
  <option value="failed">Failed</option>
  <option value="settled">Settled</option>
</select>
```

---

## Visual Differences

### Before Fix

```
User clicks "Cancel" during payment
↓
TrueLayer: status="failed", failure_reason="user_canceled_at_provider"
↓
Our app: Shows "FAILED" badge (red) ❌
↓
Payment detail: "Payment Failed" (red card)
↓
User: "Wait, I cancelled it, it didn't fail!"
```

---

### After Fix

```
User clicks "Cancel" during payment
↓
TrueLayer: status="failed", failure_reason="user_canceled_at_provider"
↓
Our mapper: Detects "user_canceled_at_provider" → Maps to "cancelled"
↓
Our app: Shows "CANCELLED" badge (yellow/amber) ✅
↓
Payment detail: "Payment Cancelled" (yellow card)
↓
User: "Perfect, I cancelled it as expected!"
```

---

## Status Colors Summary

| Status | Badge Color | Meaning | Card Color |
|--------|-------------|---------|------------|
| `authorization_required` | Yellow | Pending | No card (shows link) |
| `authorizing` | Yellow | In progress | No card (shows link) |
| `authorized` | Green | Success | Green success card |
| `executed` | Green | Success | Green success card |
| `settled` | Green | Success | Green success card |
| **`cancelled`** | **Yellow/Amber** | **User cancelled** | **Yellow warning card** |
| `failed` | Red | Actual failure | Red failure card |

---

## Testing

### Test 1: User Cancels Payment

1. **Create a payment**
2. **Click "Pay" button** (goes to TrueLayer)
3. **Click "Cancel"** on TrueLayer page
4. **Expected:**
   - Returns to dashboard
   - Payment shows **"CANCELLED"** badge (yellow/amber)
   - Click payment → See yellow **"Payment Cancelled"** card
   - Message: "This payment was cancelled"

### Test 2: Payment Fails (Not Cancelled)

1. **Simulate a real failure** (e.g., insufficient funds in test account)
2. **Expected:**
   - Payment shows **"FAILED"** badge (red)
   - Click payment → See red **"Payment Failed"** card
   - Message: "This payment could not be completed"

### Test 3: Filter by Cancelled

1. **Go to dashboard**
2. **Select "Cancelled" from status filter**
3. **Expected:**
   - Only shows cancelled payments
   - Badge is yellow/amber
   - Distinct from failed payments

---

## Why This Matters

### User Experience

**Cancelled ≠ Failed:**
- **Cancelled** = "I changed my mind" (User action, intentional)
- **Failed** = "Something went wrong" (Error, unexpected)

**Clear communication:**
- Yellow = Warning/info (user action)
- Red = Error (system/bank problem)

### Reporting & Analytics

**Accurate data:**
- Know how many users cancel vs. encounter failures
- Identify UX issues (high cancellation rate?)
- Debug real failures without noise from cancellations

---

## Files Changed

### Backend
- ✅ `server/src/types/payment.ts` - Added `cancelled` status, `failure_reason` field
- ✅ `server/src/routes/payments.ts` - Added `mapPaymentStatus()` helper, updated all status checks

### Frontend
- ✅ `client/src/types/payment.ts` - Added `cancelled` status
- ✅ `client/src/pages/Dashboard.tsx` - Added cancelled filter option
- ✅ `client/src/pages/PaymentDetail.tsx` - Added cancelled card & status handling
- ✅ `client/src/pages/PaymentDetail.module.css` - Added `.statusCancelled` styling
- ✅ `client/src/components/PaymentsList.tsx` - Added cancelled status handling
- ✅ `client/src/components/PaymentsList.module.css` - Added `.statusCancelled` styling

---

## Summary

✅ **Fixed:** Cancelled payments now properly show "Cancelled" instead of "Failed"  
✅ **Added:** Smart status mapping based on TrueLayer's `failure_reason`  
✅ **Improved:** Clear visual distinction (yellow vs red)  
✅ **Better UX:** Users understand the difference between cancelling and failure

**Now cancelled payments are properly recognized and displayed!** 🎉
