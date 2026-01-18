import { Payment, PaymentStatus } from '../types/payment.js';

/**
 * In-Memory Database Store
 * Simple Map-based storage for development without DynamoDB
 */
class MemoryStore {
  private payments: Map<string, Payment> = new Map();

  /**
   * Create a new payment
   */
  async createPayment(payment: Payment): Promise<Payment> {
    const key = `${payment.userId}#${payment.paymentId}`;
    this.payments.set(key, payment);
    return payment;
  }

  /**
   * Get a payment by userId and paymentId
   */
  async getPayment(userId: string, paymentId: string): Promise<Payment | null> {
    const key = `${userId}#${paymentId}`;
    return this.payments.get(key) || null;
  }

  /**
   * List all payments for a user, optionally filtered by status
   */
  async listPayments(userId: string, status?: PaymentStatus): Promise<Payment[]> {
    const userPayments = Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId
    );

    if (status) {
      return userPayments.filter((payment) => payment.status === status);
    }

    return userPayments;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    userId: string,
    paymentId: string,
    status: PaymentStatus,
    trueLayerData?: any
  ): Promise<Payment> {
    const key = `${userId}#${paymentId}`;
    const payment = this.payments.get(key);

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = status;
    payment.updatedAt = new Date().toISOString();
    if (trueLayerData) {
      payment.trueLayerData = trueLayerData;
    }

    this.payments.set(key, payment);
    return payment;
  }

  /**
   * Get payment statistics (for graphs)
   */
  async getPaymentStats(userId: string, days: number = 7): Promise<Payment[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    return Array.from(this.payments.values()).filter(
      (payment) =>
        payment.userId === userId && payment.createdAt >= startDateStr
    );
  }

  /**
   * Search payments by reference or amount
   */
  async searchPayments(userId: string, searchTerm: string): Promise<Payment[]> {
    const allPayments = await this.listPayments(userId);
    const searchLower = searchTerm.toLowerCase();

    return allPayments.filter(
      (payment) =>
        payment.reference.toLowerCase().includes(searchLower) ||
        payment.amount.toString().includes(searchTerm)
    );
  }
}

// Export singleton instance
export const memoryStore = new MemoryStore();
