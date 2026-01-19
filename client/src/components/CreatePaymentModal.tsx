import { useState } from 'react';
import { apiClient } from '../services/api';
import type { CreatePaymentRequest } from '../types/payment';
import styles from './CreatePaymentModal.module.css';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePaymentModal({ isOpen, onClose, onSuccess }: CreatePaymentModalProps) {
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    amount: 0,
    currency: 'GBP',
    reference: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.reference.trim()) {
      setError('Reference is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payment = await apiClient.createPayment(formData);
      
      setSuccess(true);
      setPaymentLink(payment.paymentLink || null);
      
      // Reset form after short delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: 0,
      currency: 'GBP',
      reference: '',
    });
    setError(null);
    setSuccess(false);
    setPaymentLink(null);
    setCopied(false);
    onClose();
  };

  const copyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {!success && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Payment</h3>
              </div>
            )}

            {success ? (
              <div className="text-center py-6 px-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Created!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your payment has been created successfully. Click below to proceed with the payment.
                </p>
                {paymentLink && (
                  <button
                    onClick={() => window.location.href = paymentLink}
                    className="w-full max-w-md mx-auto px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-lg font-semibold transition-all shadow-lg"
                  >
                    Go to Payment
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-1">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="px-1">
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                    Reference *
                  </label>
                  <input
                    type="text"
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    style={{ boxSizing: 'border-box' }}
                    placeholder="e.g., Invoice #12345"
                    required
                  />
                </div>

                <div className="px-1">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="any"
                    min="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, amount: val });
                    }}
                    onBlur={(e) => {
                      // Round to 2 decimal places on blur
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, amount: Math.round(val * 100) / 100 });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    style={{ boxSizing: 'border-box' }}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="px-1">
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    style={{ 
                      boxSizing: 'border-box',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    } as React.CSSProperties}
                    required
                  >
                    <option value="GBP">🇬🇧 GBP - British Pound</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6 px-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Payment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePaymentModal;
