# Feature: Retry & Delete Unpaid Payments

## Features Added âď¸

### 1. **"Try Again" Button** for Failed/Cancelled Payments
- Yellow retry button (đ icon) appears for `failed` and `cancelled` payments
- Clicking it reopens the TrueLayer payment page
- Allows users to retry the payment without creating a new one

### 2. **"Delete" Button** for Unpaid Payments  
- Red garbage can button (đď¸ icon) for unpaid payments
- Shows for: `authorization_required`, `authorizing`, `failed`, `cancelled`
- Cannot delete completed payments (`executed`, `settled`, `authorized`)
- Confirmation dialog before deletion

---

## User Interface

### Dashboard Payment List - Actions Column

**Before:** Only "View Details" button

**After:** Smart action buttons based on payment status

| Payment Status | Try Again | Delete | View Details |
|---|---|---|---|
| `authorization_required` | â | â | â |
| `authorizing` | â | â | â |
| `failed` | â | â | â |
| `cancelled` | â | â | â |
| `authorized` | â | â | â |
| `executed` | â | â | â |
| `settled` | â | â | â |

### Button Styles

**Try Again Button (Yellow/Amber):**
- Background: Light yellow (`#fef3c7`)
- Border: Yellow (`#fde047`)
- Icon: Circular arrows (retry icon)
- Appears only if payment has a valid `paymentLink`

**Delete Button (Red):**
- Background: Light red (`#fee2e2`)
- Border: Red (`#fca5a5`)
- Icon: Garbage can
- Shows confirmation: "Delete payment "[reference]"?"

**View Details Button (Blue):**
- Text button, no background
- Always visible for all payments

---

## Backend Implementation

### New DELETE Endpoint

**Route:** `DELETE /api/payments/:id`

**Logic:**
1. Get payment from database
2. Check if payment exists
3. Verify status is deletable:
   - `authorization_required` â
   - `authorizing` â
   - `failed` â
   - `cancelled` â
   - Others â (Return 400 error)
4. Delete from DynamoDB
5. Return 204 No Content

**Error Responses:**
- 404: Payment not found
- 400: Cannot delete paid/completed payments
- 500: Server error

### Repository Function

**New function:** `deletePayment(userId, paymentId)`
- Uses DynamoDB `DeleteCommand`
- Deletes by composite key (userId + paymentId)

---

## Frontend Implementation

### API Client (`client/src/services/api.ts`)

**New method:**
```typescript
async deletePayment(paymentId: string): Promise<void> {
  console.log(`đď¸ API: Deleting payment ${paymentId}...`);
  await this.client.delete(`/api/payments/${paymentId}`);
  console.log(`â API: Payment deleted successfully`);
}
```

### Dashboard (`client/src/pages/Dashboard.tsx`)

**New handlers:**

```typescript
const handleDeletePayment = async (paymentId: string) => {
  try {
    await apiClient.deletePayment(paymentId);
    await fetchPayments(); // Refresh list
  } catch (error: any) {
    alert('Failed to delete payment: ' + error.message);
  }
};

const handleRetryPayment = (paymentLink: string) => {
  window.location.href = paymentLink; // Navigate to payment page
};
```

### PaymentsList Component

**Updated props:**
```typescript
interface PaymentsListProps {
  payments: Payment[];
  onPaymentClick: (paymentId: string) => void;
  onDeletePayment?: (paymentId: string) => void;  // NEW!
  onRetryPayment?: (paymentLink: string) => void;  // NEW!
}
```

**Actions column rendering:**
```typescript
<td className={styles.actionsCell}>
  {/* Try Again - only for failed/cancelled with payment link */}
  {(payment.status === 'cancelled' || payment.status === 'failed') && 
   payment.paymentLink && onRetryPayment && (
    <button onClick={() => onRetryPayment(payment.paymentLink!)}>
      <RetryIcon />
    </button>
  )}
  
  {/* Delete - only for unpaid payments */}
  {(['authorization_required', 'authorizing', 'failed', 'cancelled']
    .includes(payment.status)) && onDeletePayment && (
    <button onClick={() => {
      if (confirm(`Delete payment "${payment.reference}"?`)) {
        onDeletePayment(payment.paymentId);
      }
    }}>
      <TrashIcon />
    </button>
  )}
  
  {/* View Details - always */}
  <button onClick={() => onPaymentClick(payment.paymentId)}>
    View Details
  </button>
</td>
```

---

## Use Cases

### Use Case 1: Retry Failed Payment

**Scenario:** User's payment failed due to insufficient funds, now has funds available

**Flow:**
1. User sees payment with status "FAILED" on dashboard
2. Clicks yellow "Try Again" button (đ)
3. Redirected to TrueLayer payment page
4. Completes payment with same details
5. Returns to dashboard with updated status

**Benefits:**
- No need to create duplicate payment
- Maintains payment history
- Same payment ID and reference

---

### Use Case 2: User Cancels Then Deletes

**Scenario:** User accidentally created wrong payment, cancelled it

**Flow:**
1. User clicks "Cancel" on TrueLayer page
2. Returns to dashboard, sees "CANCELLED" status
3. Clicks red delete button (đď¸)
4. Confirms deletion in dialog
5. Payment removed from list

**Benefits:**
- Keeps dashboard clean
- Removes unwanted payments
- Cannot accidentally delete completed payments

---

### Use Case 3: Delete Stuck Authorization

**Scenario:** Payment created but user never completed it

**Flow:**
1. Payment sits in "AUTHORIZATION REQUIRED" status
2. User decides not to proceed
3. Clicks delete button
4. Payment removed from dashboard

**Benefits:**
- Clean up abandoned payments
- Reduce clutter
- Better dashboard overview

---

## Security & Safety

### Cannot Delete Completed Payments

**Protected statuses:**
- `authorized` - Payment was authorized by bank
- `executed` - Payment completed
- `settled` - Funds transferred

**Why?**
- Financial record keeping
- Audit trail
- Legal compliance
- Prevents accidental deletion of important records

### Confirmation Dialog

- "Delete payment "[reference]"?" confirmation required
- Prevents accidental clicks
- User must explicitly confirm

### User Isolation

- Backend verifies `userId` from JWT token
- Users can only delete their own payments
- No way to delete other users' payments

---

## Testing

### Test 1: Try Again Button

1. **Create payment**
2. **Cancel it** on TrueLayer page
3. **Expected:**
   - Payment shows "CANCELLED" status
   - Yellow retry button (đ) visible
   - Click it â Redirected to TrueLayer
   - Can complete payment â

4. **Try with failed payment:**
   - Same behavior as cancelled â

### Test 2: Delete Button

1. **Create payment** but don't pay
2. **Check dashboard:**
   - Red delete button visible â
   - Click it â Confirmation dialog appears â
   - Confirm â Payment deleted from list â

3. **Try to delete completed payment:**
   - Complete a payment
   - Check dashboard â No delete button for completed payment â

### Test 3: Both Buttons on Cancelled Payment

1. **Create and cancel payment**
2. **Dashboard shows:**
   - "CANCELLED" status â
   - Yellow "Try Again" button â
   - Red "Delete" button â
   - Blue "View Details" button â

**User can choose:**
- Retry the payment, or
- Delete it, or
- View details

---

## Files Changed

### Backend
- â `server/src/db/payments.repository.ts` - Added `deletePayment()` function
- â `server/src/routes/payments.ts` - Added `DELETE /:id` endpoint

### Frontend
- â `client/src/services/api.ts` - Added `deletePayment()` method
- â `client/src/pages/Dashboard.tsx` - Added `handleDeletePayment()` and `handleRetryPayment()`
- â `client/src/components/PaymentsList.tsx` - Added retry and delete buttons
- â `client/src/components/PaymentsList.module.css` - Added button styles

---

## Why This Matters

### User Experience

**Before:**
- Failed payment stuck forever
- Only option: Create new payment (duplicate)
- Dashboard cluttered with old attempts
- No way to clean up

**After:**
- Failed payment? Try again instantly!
- Don't want it? Delete it!
- Clean dashboard with only relevant payments
- Professional, polished UX

### Real-World Scenarios

**Customer support:**
"I accidentally created a payment for $100 instead of $10"
â Solution: Cancel and delete, create correct one

**Insufficient funds:**
"My payment failed, but I have funds now"
â Solution: Click "Try Again", no need to recreate

**Testing:**
"I created test payments, how do I clean them up?"
â Solution: Delete button for each test payment

---

## Summary

â **Try Again:** Retry failed/cancelled payments instantly  
â **Delete:** Remove unpaid payments to keep dashboard clean  
â **Safety:** Cannot delete completed payments  
â **Confirmation:** Dialog prevents accidental deletions  
â **Smart Display:** Buttons only show when appropriate

**Clean, intuitive, and safe payment management!** đ
