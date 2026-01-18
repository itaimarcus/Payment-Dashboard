import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Payment, CreatePaymentRequest, PaymentStatus, PaymentStats } from '../types/payment';

/**
 * API client for backend communication
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Set the authorization token for API requests
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove the authorization token
   */
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      const response = await this.client.post<Payment>('/api/payments', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all payments, optionally filtered by status
   */
  async getPayments(status?: PaymentStatus): Promise<Payment[]> {
    try {
      console.log('📡 API: Fetching payments...');
      console.log('   URL:', this.client.defaults.baseURL + '/api/payments');
      console.log('   Auth header:', this.client.defaults.headers.common['Authorization'] ? 'Present (Bearer ...)' : 'MISSING');
      console.log('   Params:', status ? { status } : 'none');
      
      const params = status ? { status } : {};
      const response = await this.client.get<Payment[]>('/api/payments', { params });
      
      console.log('✅ API: Payments fetched successfully');
      console.log('   Count:', response.data.length);
      
      return response.data;
    } catch (error) {
      console.error('❌ API: Failed to fetch payments');
      if (axios.isAxiosError(error)) {
        console.error('   Status:', error.response?.status);
        console.error('   Status text:', error.response?.statusText);
        console.error('   Response data:', error.response?.data);
        console.error('   Request URL:', error.config?.url);
        console.error('   Auth header present:', !!error.config?.headers?.Authorization);
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get a single payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const response = await this.client.get<Payment>(`/api/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search payments by reference or amount
   */
  async searchPayments(searchTerm: string): Promise<Payment[]> {
    try {
      const response = await this.client.get<Payment[]>('/api/payments/search', {
        params: { q: searchTerm },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payment statistics for graphs
   */
  async getPaymentStats(days: number = 7): Promise<PaymentStats[]> {
    try {
      const response = await this.client.get<PaymentStats[]>('/api/payments/stats', {
        params: { days },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message ||
        'An unexpected error occurred';
      return new Error(message);
    }
    return error as Error;
  }
}

export const apiClient = new ApiClient();
