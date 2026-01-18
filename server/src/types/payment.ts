/**
 * Payment status types from TrueLayer
 */
export type PaymentStatus = 
  | 'authorization_required'
  | 'authorizing'
  | 'authorized'
  | 'failed'
  | 'executed'
  | 'settled';

/**
 * Payment object stored in DynamoDB
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
 * Request body for creating a new payment
 */
export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  beneficiaryName?: string;
  beneficiaryReference?: string;
}

/**
 * TrueLayer API response types
 */
export interface TrueLayerPaymentResponse {
  id: string;
  amount_in_minor: number;
  currency: string;
  payment_method: any;
  user: any;
  status: PaymentStatus;
  created_at: string;
  resource_token?: string;
  hosted_payments_page_url?: string;
}
