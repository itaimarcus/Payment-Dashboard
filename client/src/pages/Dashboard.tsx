import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'reference' | 'amount' | 'id'>('reference');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [sortByAmount, setSortByAmount] = useState(true);
  const [isRefreshingFromPayment, setIsRefreshingFromPayment] = useState(false);

  // Check if returning from payment immediately (before any rendering)
  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const fromPayment = searchParams.get('from_payment');
    
    if (paymentId || fromPayment) {
      // Set loading state immediately to prevent showing stale data
      setIsRefreshingFromPayment(true);
    }
  }, []); // Run once on mount

  // Clear search term when search type changes
  useEffect(() => {
    setSearchTerm('');
  }, [searchType]);

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

  // Detect return from payment and auto-refresh
  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const fromPayment = searchParams.get('from_payment');
    
    if ((paymentId || fromPayment) && tokenReady) {
      console.log('🔄 Returned from payment page, refreshing status...');
      setRefreshMessage('Checking payment status...');
      
      // Clean URL params
      searchParams.delete('payment_id');
      searchParams.delete('from_payment');
      setSearchParams(searchParams, { replace: true });
      
      // Single API call - backend handles the polling internally
      const refreshAndFetch = async () => {
        try {
          if (paymentId) {
            console.log(`   Making single refresh request (backend will poll)...`);
            const updatedPayment = await apiClient.refreshPaymentStatus(paymentId) as Payment & { statusMessage?: string; canRetry?: boolean };
            console.log(`   ✅ Status received: ${updatedPayment.status}`);
            
            // Check if status is still processing after all attempts
            if (updatedPayment.statusMessage) {
              console.log(`   ⚠️ ${updatedPayment.statusMessage}`);
              setRefreshMessage(updatedPayment.statusMessage + ' You can refresh manually or wait.');
              
              // Clear message after 10 seconds
              setTimeout(() => setRefreshMessage(null), 10000);
            } else {
              // Status updated successfully, clear message immediately
              setRefreshMessage(null);
            }
          }
        } catch (error) {
          console.warn('   Failed to refresh payment status, continuing anyway...');
          setRefreshMessage('Unable to check payment status. Please try refreshing the page.');
          setTimeout(() => setRefreshMessage(null), 5000);
        }
        
        // Fetch all payments to show updated list (without showing loading spinner)
        try {
          const data = await apiClient.getPayments();
          const sortedData = data.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setPayments(sortedData);
          setFilteredPayments(sortedData);
        } catch (err: any) {
          console.error('Failed to fetch payments:', err);
        } finally {
          // Clear the refreshing state so UI can render
          setIsRefreshingFromPayment(false);
        }
      };
      
      // Start immediately - single call, backend does the work
      refreshAndFetch();
    }
  }, [searchParams, tokenReady]);

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
      filtered = filtered.filter((p) => {
        if (searchType === 'reference') {
          return p.reference.toLowerCase().includes(searchLower);
        } else if (searchType === 'amount') {
          return p.amount.toString().includes(searchTerm);
        } else if (searchType === 'id') {
          return p.paymentId.toLowerCase().includes(searchLower);
        }
        return true;
      });
    }

    // Sort filtered results - create a new array to ensure React detects the change
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (!sortByAmount) {
        // Sort by amount (largest to smallest)
        return b.amount - a.amount;
      } else {
        // Default: Sort by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredPayments(sortedFiltered);
  }, [payments, statusFilter, searchTerm, searchType, sortByAmount]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getPayments();
      
      // Sort by creation date - newest first (top of list)
      const sortedData = data.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setPayments(sortedData);
      setFilteredPayments(sortedData);
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

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await apiClient.deletePayment(paymentId);
      // Refresh the payment list
      await fetchPayments();
    } catch (error: any) {
      alert('Failed to delete payment: ' + error.message);
    }
  };

  const handleRetryPayment = async (payment: Payment) => {
    try {
      // Create a NEW payment with the same details (failed links are expired)
      const newPayment = await apiClient.createPayment({
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference.replace(' (retry)', ''),
      });
      
      // Navigate to the new payment link
      if (newPayment.paymentLink) {
        window.location.href = newPayment.paymentLink;
      }
    } catch (error: any) {
      alert('Failed to retry payment: ' + error.message);
    }
  };

  const handleToggleAmountSort = () => {
    setSortByAmount(!sortByAmount);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerInfo}>
              <h1>Payment Dashboard</h1>
              <p>Welcome, {user?.name || user?.username || user?.email}</p>
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
              {/* Search Type Selector */}
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'reference' | 'amount' | 'id')}
                className={styles.statusFilter}
                style={{ width: 'auto', minWidth: '120px' }}
              >
                <option value="reference">Reference</option>
                <option value="id">Payment ID</option>
                <option value="amount">Amount</option>
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder={
                  searchType === 'reference' ? 'Search by reference...' :
                  searchType === 'amount' ? 'Search by amount...' :
                  'Search by payment ID...'
                }
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
                <option value="authorization_required">Ready</option>
                <option value="executed">Completed</option>
                <option value="failed">Failed</option>
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

        {/* Refresh Message */}
        {refreshMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">{refreshMessage}</p>
          </div>
        )}

        {/* Payments List */}
        <div className={styles.paymentsContainer}>
          {(loading || isRefreshingFromPayment) ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>
                {isRefreshingFromPayment ? 'Updating payment status...' : 'Loading payments...'}
              </p>
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
            <PaymentsList
              payments={filteredPayments}
              onPaymentClick={handlePaymentClick}
              onDeletePayment={handleDeletePayment}
              onRetryPayment={handleRetryPayment}
              hasAnyPayments={payments.length > 0}
              isAllStatusesFilter={statusFilter === 'all'}
              sortByAmount={sortByAmount}
              onToggleAmountSort={handleToggleAmountSort}
            />
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
