# Better Approach: Cancelled Payments Stay as Authorization Required

## Key Philosophy Change ✅

**Old thinking:** Cancelled = Failed (separate status)  
**New thinking:** Cancelled = "Not completed yet" (still valid for retry)

---

## The Insight

When a user clicks "Cancel" on the TrueLayer page:
- ❌ **NOT a failure** - nothing went wrong
- ❌ **NOT broken** - payment link still works
- ✅ **Just didn't complete** - can still use same payment link anytime

**It's like:**
- Creating a payment = "Opening a door"
- Cancelling = "Walking away without going through"
- The door is **still open** for them to return!

---

## How It Works Now

### Backend Status Mapping

**When TrueLayer returns:**
```json
{
  "status": "failed",
  "failure_reason": "user_canceled_at_provider"
}
```

**Our mapper does:**
```typescript
function mapPaymentStatus(trueLayerPayment) {
  if (status === 'failed' && failure_reason === 'user_canceled_at_provider') {
    return 'authorization_required';  // Keep the door open! ✅
  }
  return status;  // Actual failures stay as 'failed'
}
```

**Result:**
- Payment stays as `authorization_required`
- Payment link remains valid
- User can retry anytime
- No new payment needed

---

## User Experience

### Scenario: User Cancels Payment

**Flow:**
1. User creates payment for £50 (ref: "Lunch")
2. Goes to TrueLayer page
3. **Clicks "Cancel"** (changes mind)
4. Returns to dashboard

**What user sees:**
```
Dashboard:
┌─────────────────────────────────────────┐
│ Lunch | £50 | AUTHORIZATION REQUIRED   │
│ [🗑️ Delete] [View Details]             │
└─────────────────────────────────────────┘
```

**User's options:**
- ✅ **Click the payment** → Goes back to TrueLayer → Can complete it
- ✅ **Delete it** → Removes from dashboard
- ✅ **Leave it** → Can pay later

**Key point:** Payment is **NOT marked as failed** - it's still pending/available!

---

### Scenario: Payment Actually Fails

**Flow:**
1. User creates payment for £50
2. Goes to TrueLayer page
3. Selects account with insufficient funds
4. **Bank rejects the payment** (actual failure)
5. Returns to dashboard

**What user sees:**
```
Dashboard:
┌─────────────────────────────────────────┐
│ Lunch | £50 | FAILED                   │
│ [🔄 Try Again] [🗑️ Delete] [View]      │
└─────────────────────────────────────────┘
```

**User's options:**
- ✅ **Try Again button** (yellow) → Creates fresh attempt at TrueLayer
- ✅ **Delete it** → Removes from dashboard
- ✅ **View details** → See failure information

---

## Button Logic Summary

| Payment Status | Meaning | Try Again Button | Delete Button | Payment Link |
|---|---|---|---|---|
| `authorization_required` | Not completed yet | ❌ No (link still works) | ✅ Yes | ✅ Valid |
| `failed` | Actually failed | ✅ Yes | ✅ Yes | ✅ Valid (retry) |
| `executed` | Completed | ❌ No | ❌ No | ❌ No link shown |

---

## Why This is Better

### For Users Who Cancel

**Old approach (cancelled = failed):**
```
User: "I clicked cancel, why does it say FAILED?"
→ Confusing messaging
→ Looks like an error
→ User thinks something broke
→ Bad UX ❌
```

**New approach (cancelled = still available):**
```
User: "I clicked cancel"
Dashboard: Shows "AUTHORIZATION REQUIRED" (yellow)
User: "Oh, I can still pay this if I want"
→ Clear status
→ Payment link still works
→ Can complete anytime
→ Great UX ✅
```

### For Users Who Face Real Failures

**Payment fails (insufficient funds):**
```
Dashboard: Shows "FAILED" (red)
User sees: Yellow "Try Again" button
User: "Ah, I'll try again with a different account"
→ Clear that something went wrong
→ Easy path to retry
→ Helpful UX ✅
```

---

## Code Changes Summary

### Backend (`server/src/routes/payments.ts`)

**Changed mapping logic:**
```typescript
// Before:
if (failure_reason === 'user_canceled_at_provider') {
  return 'cancelled';  // Separate status
}

// After:
if (failure_reason === 'user_canceled_at_provider') {
  return 'authorization_required';  // Keep link valid! ✅
}
```

### Frontend

**Removed:**
- ❌ `cancelled` status type
- ❌ Cancelled badge styling
- ❌ "Payment Cancelled" card
- ❌ "Cancelled" filter option

**Updated:**
- ✅ Failed payment message mentions "Try Again" button
- ✅ Try Again button only for `failed` status
- ✅ Delete button for `authorization_required`, `authorizing`, `failed`

---

## Real-World Flow Examples

### Example 1: Create, Cancel, Complete Later

```
Day 1, 10:00 AM:
→ Create payment "Coffee" £3.50
→ Go to TrueLayer
→ Click "Cancel" (forgot wallet)
→ Dashboard: "AUTHORIZATION REQUIRED"

Day 1, 2:00 PM:
→ Click "Coffee" payment in dashboard
→ Goes to TrueLayer
→ Complete payment ✅
→ Dashboard: "EXECUTED"
```

**Payment link remained valid for 4 hours!**

---

### Example 2: Fail, Then Retry

```
10:00 AM:
→ Create payment "Rent" £1,200
→ Go to TrueLayer
→ Select account with £500 (insufficient)
→ Payment fails
→ Dashboard: "FAILED" with yellow "Try Again" button

10:05 AM:
→ Click yellow "Try Again" button
→ Goes to TrueLayer
→ Select account with £2,000 ✅
→ Payment completes!
```

**Same payment, different outcome!**

---

### Example 3: Wrong Amount, Delete

```
→ Create payment £1,000 (meant £100)
→ Notice mistake before paying
→ Click red "Delete" button
→ Confirm deletion
→ Create new payment £100
→ Complete it ✅
```

**Clean up before any money moves!**

---

## Status Meanings Clarified

| Status | What It Means | Can User Still Pay? | Can Delete? |
|---|---|---|---|
| `authorization_required` | Link created, not completed yet | ✅ Yes, link is valid | ✅ Yes |
| `authorizing` | User is at bank page right now | ✅ Yes, in progress | ✅ Yes (edge case) |
| `failed` | Something went wrong during payment | ✅ Yes, can retry | ✅ Yes |
| `authorized` | Bank approved, money moving | ❌ No, it's done | ❌ No |
| `executed` | Payment completed | ❌ No, it's done | ❌ No |
| `settled` | Money transferred | ❌ No, it's done | ❌ No |

---

## Testing

### Test 1: Cancel Doesn't Show as Failed

1. **Create payment**
2. **Click "Cancel"** on TrueLayer page
3. **Expected:**
   - ✅ Dashboard shows "AUTHORIZATION REQUIRED" (yellow)
   - ❌ Does NOT show "FAILED" (red)
   - ✅ No "Try Again" button (link already works)
   - ✅ Shows "Delete" button

4. **Click the payment again:**
   - ✅ Takes you to TrueLayer
   - ✅ Can complete the payment
   - ✅ Link still works!

### Test 2: Real Failure Shows Try Again

1. **Simulate actual failure** (if possible in sandbox)
2. **Expected:**
   - ✅ Dashboard shows "FAILED" (red)
   - ✅ Yellow "Try Again" button visible
   - ✅ Delete button also visible

### Test 3: Delete Any Unpaid Payment

1. **Try to delete:**
   - Pending payment → ✅ Works
   - Failed payment → ✅ Works
   - Completed payment → ❌ No delete button shown

---

## Summary

✅ **Cancelled = Still available** (not failed)  
✅ **Payment links stay valid** after cancel  
✅ **Failed = Actually failed** (shows Try Again)  
✅ **Messages updated** to mention Try Again/Delete buttons  
✅ **Simpler status model** (no separate cancelled status)

**This matches how users think about cancellation!** 🎯

**The payment link doesn't "break" when you cancel - it's still there waiting for you whenever you're ready!**
