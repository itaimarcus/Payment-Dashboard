/**
 * Payment status types
 */
export type PaymentStatus =
  | 'authorization_required'
  | 'authorizing'
  | 'authorized'
  | 'failed'
  | 'executed'
  | 'settled';

/**
 * Payment object
 */
export interface Payment {
  userId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  createdAt: string;
  updatedAt: string;
  paymentLink?: string;
  trueLayerData?: any;
}

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  beneficiaryName?: string;
  beneficiaryReference?: string;
}

/**
 * Payment stats for graphs
 */
export interface PaymentStats {
  date: string;
  total: number;
  count: number;
  currency: string;
}
