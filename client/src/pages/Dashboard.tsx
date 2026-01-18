import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { useAuthToken } from '../contexts/AuthTokenContext';
import { apiClient } from '../services/api';
import type { Payment, PaymentStatus } from '../types/payment';
import CreatePaymentModal from '../components/CreatePaymentModal';
import PaymentsList from '../components/PaymentsList';
import PaymentStats from '../components/PaymentStats';
import styles from './Dashboard.module.css';

function Dashboard() {
  const { user, logout } = useAuth0();
  const { tokenReady, tokenError } = useAuthToken();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fetch payments when token is ready
  useEffect(() => {
    if (tokenReady) {
      console.log('🎯 Token is ready, fetching payments...');
      fetchPayments();
    } else if (tokenError) {
      console.error('🚫 Token error, cannot fetch payments');
      setError('Authentication error: ' + tokenError);
      setLoading(false);
    }
  }, [tokenReady, tokenError]);

  // Filter payments when filter or search changes
  useEffect(() => {
    let filtered = payments;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.reference.toLowerCase().includes(searchLower) ||
          p.amount.toString().includes(searchTerm) ||
          p.paymentId.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPayments();
      setPayments(data);
      setFilteredPayments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handlePaymentClick = (paymentId: string) => {
    navigate(`/payments/${paymentId}`);
  };

  const handlePaymentCreated = () => {
    setIsCreateModalOpen(false);
    fetchPayments();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.logoContainer}>
              <svg
                className={styles.logoIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className={styles.headerInfo}>
              <h1>Payment Dashboard</h1>
              <p>Welcome, {user?.name || user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Toggle */}
        <div className={styles.statsToggle}>
          <button
            onClick={() => setShowStats(!showStats)}
            className={styles.statsToggleButton}
          >
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </button>
        </div>

        {/* Statistics */}
        {showStats && (
          <div className={styles.statsContainer}>
            <PaymentStats />
          </div>
        )}

        {/* Actions Bar */}
        <div className={styles.actionsBar}>
          <div className={styles.actionsContent}>
            <div className={styles.actionsLeft}>
              {/* Search */}
              <input
                type="text"
                placeholder="Search by reference, amount, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                className={styles.statusFilter}
              >
                <option value="all">All Statuses</option>
                <option value="authorization_required">Authorization Required</option>
                <option value="authorizing">Authorizing</option>
                <option value="authorized">Authorized</option>
                <option value="executed">Executed</option>
                <option value="failed">Failed</option>
                <option value="settled">Settled</option>
              </select>
            </div>

            {/* Create Payment Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className={styles.createButton}
            >
              <svg
                className={styles.createButtonIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Payment
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className={styles.paymentsContainer}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Loading payments...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
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
              <p className={styles.errorTitle}>Error loading payments</p>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={fetchPayments}
                className={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          ) : (
            <PaymentsList payments={filteredPayments} onPaymentClick={handlePaymentClick} />
          )}
        </div>
      </main>

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePaymentCreated}
      />
    </div>
  );
}

export default Dashboard;
