import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { Payment } from '../types/payment';
import styles from './PaymentDetail.module.css';

function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPayment(id);
    }
  }, [id]);

  const fetchPayment = async (paymentId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPayment(paymentId);
      setPayment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPaymentLink = () => {
    if (payment?.paymentLink) {
      navigator.clipboard.writeText(payment.paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'executed':
      case 'settled':
        return `${styles.statusBadge} ${styles.statusExecuted}`;
      case 'authorized':
        return `${styles.statusBadge} ${styles.statusAuthorized}`;
      case 'authorization_required':
      case 'authorizing':
        return `${styles.statusBadge} ${styles.statusAuthorizationRequired}`;
      case 'failed':
        return `${styles.statusBadge} ${styles.statusFailed}`;
      default:
        return styles.statusBadge;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorContent}>
          <svg
            className={styles.errorIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className={styles.errorTitle}>Payment Not Found</h2>
          <p className={styles.errorMessage}>{error || 'The payment you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className={styles.errorButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={() => navigate('/dashboard')}
            className={styles.backButton}
          >
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className={styles.title}>Payment Details</h1>
        </div>
      </header>

      <main className={styles.main}>
        {/* Payment Status Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Status</h2>
            <span className={getStatusClass(payment.status)}>
              {payment.status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Payment Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Payment Information</h2>
          <dl className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <dt>Payment ID</dt>
              <dd className={styles.paymentIdText}>{payment.paymentId}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Reference</dt>
              <dd>{payment.reference}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Amount</dt>
              <dd className={styles.amount}>
                {payment.currency} {payment.amount.toFixed(2)}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Currency</dt>
              <dd>{payment.currency}</dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Created</dt>
              <dd>
                {new Date(payment.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Last Updated</dt>
              <dd>
                {new Date(payment.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment Link */}
        {payment.paymentLink && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Link</h2>
            <div className={styles.linkSection}>
              <input
                type="text"
                value={payment.paymentLink}
                readOnly
                className={styles.linkInput}
              />
              <button
                onClick={copyPaymentLink}
                className={styles.copyButton}
              >
                {copied ? (
                  <>
                    <svg className={styles.copyIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className={styles.linkHelp}>
              Share this link with customers to complete the payment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PaymentDetail;
