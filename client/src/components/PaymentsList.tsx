import type { Payment } from '../types/payment';
import styles from './PaymentsList.module.css';

interface PaymentsListProps {
  payments: Payment[];
  onPaymentClick: (paymentId: string) => void;
}

function PaymentsList({ payments, onPaymentClick }: PaymentsListProps) {
  const getStatusClass = (status: string) => {
    const baseClass = styles.statusBadge;
    switch (status) {
      case 'executed':
      case 'settled':
        return `${baseClass} ${styles.statusExecuted}`;
      case 'authorized':
        return `${baseClass} ${styles.statusAuthorized}`;
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
        <h3 className={styles.emptyTitle}>No payments found</h3>
        <p className={styles.emptyText}>Create your first payment to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {payments.map((payment) => (
            <tr
              key={payment.paymentId}
              className={styles.tableRow}
              onClick={() => onPaymentClick(payment.paymentId)}
            >
              <td>
                <div className={styles.referenceCell}>{payment.reference}</div>
                <div className={styles.paymentId}>{payment.paymentId}</div>
              </td>
              <td>
                <div className={styles.amountCell}>
                  {payment.currency} {payment.amount.toFixed(2)}
                </div>
              </td>
              <td>
                <span className={getStatusClass(payment.status)}>
                  {payment.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td>
                <div className={styles.dateCell}>
                  {new Date(payment.createdAt).toLocaleDateString()}
                </div>
                <div className={styles.timeCell}>
                  {new Date(payment.createdAt).toLocaleTimeString()}
                </div>
              </td>
              <td className={styles.actionsCell}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaymentClick(payment.paymentId);
                  }}
                  className={styles.viewButton}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PaymentsList;
