import type { Payment } from '../types/payment';
import styles from './PaymentsList.module.css';

interface PaymentsListProps {
  payments: Payment[];
  onPaymentClick: (paymentId: string) => void;
  onDeletePayment?: (paymentId: string) => void;
  onRetryPayment?: (payment: Payment) => void;
  hasAnyPayments?: boolean;
  isAllStatusesFilter?: boolean;
  sortByAmount?: boolean;
  onToggleAmountSort?: () => void;
}

function PaymentsList({ payments, onPaymentClick, onDeletePayment, onRetryPayment, hasAnyPayments = true, isAllStatusesFilter = true, sortByAmount = false, onToggleAmountSort }: PaymentsListProps) {
  const getStatusClass = (status: string) => {
    const baseClass = styles.statusBadge;
    switch (status) {
      case 'executed':
      case 'settled':
        return `${baseClass} ${styles.statusExecuted}`;
      case 'authorization_required':
      case 'authorizing':
        return `${baseClass} ${styles.statusAuthorizationRequired}`;
      case 'failed':
        return `${baseClass} ${styles.statusFailed}`;
      default:
        return baseClass;
    }
  };

  if (payments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg
          className={styles.emptyIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        {!hasAnyPayments && isAllStatusesFilter ? (
          <p className={styles.emptyText}>Create your first payment to get started.</p>
        ) : (
          <h3 className={styles.emptyTitle}>No payments found</h3>
        )}
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th style={{ textAlign: 'center' }}>Reference</th>
            <th style={{ textAlign: 'center' }}>Payment ID</th>
            <th style={{ textAlign: 'center' }}>
              <button
                onClick={onToggleAmountSort}
                className={`${styles.sortButton} ${!sortByAmount ? styles.sortButtonActive : ''}`}
                title={!sortByAmount ? '' : 'Click to sort by amount'}
              >
                Amount
                {!sortByAmount && <span className={styles.sortIndicator}> ▼</span>}
              </button>
            </th>
            <th>Status</th>
            <th style={{ textAlign: 'center' }}>DATE</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {payments.map((payment) => (
            <tr
              key={payment.paymentId}
              className={styles.tableRow}
              onClick={() => onPaymentClick(payment.paymentId)}
            >
              <td style={{ textAlign: 'center' }}>
                <div className={styles.referenceCell}>{payment.reference}</div>
              </td>
              <td style={{ textAlign: 'center' }}>
                <div className={styles.paymentId}>{payment.paymentId}</div>
              </td>
              <td style={{ textAlign: 'center' }}>
                <div className={styles.amountCell}>
                  {payment.currency} {payment.amount.toFixed(2)}
                </div>
              </td>
              <td>
                <span className={getStatusClass(payment.status)}>
                  {payment.status === 'authorization_required' || payment.status === 'authorizing'
                    ? 'READY' 
                    : payment.status === 'executed' || payment.status === 'settled'
                    ? 'COMPLETED'
                    : payment.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <div className={styles.dateCell}>
                  {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                </div>
                <div className={styles.timeCell}>
                  {new Date(payment.createdAt).toLocaleTimeString('en-GB', { hour12: false })}
                </div>
              </td>
              <td className={styles.actionsCell}>
                {/* Pay button for ready payments */}
                {(payment.status === 'authorization_required' || payment.status === 'authorizing') && payment.paymentLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = payment.paymentLink!;
                    }}
                    className={styles.payButton}
                    title="Pay Now"
                  >
                    <svg className={styles.payIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </button>
                )}
                
                {/* Try Again button for failed payments */}
                {payment.status === 'failed' && onRetryPayment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetryPayment(payment);
                    }}
                    className={styles.retryButton}
                    title="Try Again"
                  >
                    <svg className={styles.retryIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                )}
                
                {/* Delete button for unpaid payments */}
                {(['authorization_required', 'authorizing', 'failed'].includes(payment.status)) && onDeletePayment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete payment "${payment.reference}"?`)) {
                        onDeletePayment(payment.paymentId);
                      }
                    }}
                    className={styles.deleteButton}
                    title="Delete"
                  >
                    <svg className={styles.deleteIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentsList;
