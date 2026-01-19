import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthToken } from '../contexts/AuthTokenContext';
import { apiClient } from '../services/api';
import type { Payment } from '../types/payment';
import styles from './PaymentDetail.module.css';

function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tokenReady, tokenError } = useAuthToken();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch payment when token is ready
  useEffect(() => {
    if (tokenReady && id) {
      fetchPayment(id);
    } else if (tokenError) {
      setError('Authentication error: ' + tokenError);
      setLoading(false);
    }
  }, [tokenReady, tokenError, id]);

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
          <span className={getStatusClass(payment.status)}>
            {payment.status === 'authorization_required' || payment.status === 'authorizing'
              ? 'READY' 
              : payment.status === 'executed' || payment.status === 'settled'
              ? 'COMPLETED'
              : payment.status.replace(/_/g, ' ').toUpperCase()}
          </span>
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
                {new Date(payment.createdAt).toLocaleDateString('en-GB')} {new Date(payment.createdAt).toLocaleTimeString('en-GB', { hour12: false })}
              </dd>
            </div>
            <div className={styles.infoItem}>
              <dt>Last Updated</dt>
              <dd>
                {new Date(payment.updatedAt).toLocaleDateString('en-GB')} {new Date(payment.updatedAt).toLocaleTimeString('en-GB', { hour12: false })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Payment Link - Show for ready and failed payments */}
        {payment.paymentLink && (payment.status === 'authorization_required' || payment.status === 'authorizing' || payment.status === 'failed') && (
          <div className={styles.card}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
              Payment link:
            </h3>
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
                <svg className={styles.copyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Go to Payment button - Only for ready/authorizing payments */}
        {payment.paymentLink && (payment.status === 'authorization_required' || payment.status === 'authorizing') && (
          <div className={styles.card}>
            <p className={styles.paymentPrompt}>
              complete your payment:
            </p>
            <button
              onClick={() => window.location.href = payment.paymentLink!}
              className={styles.goToPaymentButton}
            >
              Go to Payment
            </button>
          </div>
        )}

        {/* Completed Payment Notice */}
        {(payment.status === 'executed' || payment.status === 'settled' || payment.status === 'authorized') && (
          <div className={styles.card} style={{ 
            backgroundColor: '#f0fdf4', 
            borderColor: '#86efac',
            borderWidth: '2px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg 
                style={{ width: '48px', height: '48px', color: '#16a34a', flexShrink: 0 }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#166534', 
                  marginBottom: '4px' 
                }}>
                  Payment Completed
                </h2>
                <p style={{ color: '#15803d', fontSize: '14px', margin: 0 }}>
                  This payment has been successfully processed and completed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Failed Payment Notice */}
        {payment.status === 'failed' && (
          <div className={styles.card} style={{ 
            backgroundColor: '#fef2f2', 
            borderColor: '#fca5a5',
            borderWidth: '2px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg 
                style={{ width: '48px', height: '48px', color: '#dc2626', flexShrink: 0 }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#991b1b', 
                margin: 0
              }}>
                Payment Failed
              </h2>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PaymentDetail;
