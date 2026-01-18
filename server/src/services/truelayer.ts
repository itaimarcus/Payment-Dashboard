import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { sign } from 'truelayer-signing';
import { TrueLayerPaymentResponse, CreatePaymentRequest } from '../types/payment.js';

dotenv.config();

/**
 * TrueLayer API Service
 * Handles OAuth2 authentication and payment operations with TrueLayer
 */
class TrueLayerService {
  private axiosInstance: AxiosInstance;
  private authUrl: string;
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private privateKey: crypto.KeyObject;
  private kid: string; // Key ID

  constructor() {
    const isSandbox = process.env.NODE_ENV !== 'production';
    this.authUrl = isSandbox
      ? 'https://auth.truelayer-sandbox.com'
      : 'https://auth.truelayer.com';
    this.apiUrl = isSandbox
      ? 'https://api.truelayer-sandbox.com'
      : 'https://api.truelayer.com';
    
    this.clientId = process.env.TRUELAYER_CLIENT_ID || '';
    this.clientSecret = process.env.TRUELAYER_CLIENT_SECRET || '';
    this.kid = process.env.TRUELAYER_SIGNING_KEY_ID || crypto.randomUUID();

    // Load EC private key for request signing
    try {
      const privateKeyPath = join(process.cwd(), 'ec512-private-key.pem');
      const privateKeyPem = readFileSync(privateKeyPath, 'utf8');
      this.privateKey = crypto.createPrivateKey(privateKeyPem);
      console.log('✓ TrueLayer EC private key loaded successfully');
    } catch (error) {
      console.error('Failed to load EC private key:', error);
      throw new Error('EC private key not found. Please generate ECDSA keys.');
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to attach access token
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Generate request signature using TrueLayer official signing library
   */
  private async signRequest(method: string, path: string, body: any, idempotencyKey: string): Promise<string> {
    // Serialize body consistently - no extra whitespace
    const bodyString = JSON.stringify(body);
    
    console.log('Signing request using TrueLayer library');
    console.log('Method:', method, 'Path:', path);
    console.log('Body length:', bodyString.length);
    console.log('KID:', this.kid);
    
    // Export private key to PEM format
    const privateKeyPem = this.privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    }) as string;

    // Use TrueLayer's official signing library
    const signature = sign({
      kid: this.kid,
      privateKeyPem: privateKeyPem,
      method: method.toUpperCase(),
      path: path,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: bodyString
    });

    console.log('=== SIGNATURE DEBUG ===');
    console.log('KID:', this.kid);
    console.log('Signature generated with TrueLayer library');
    console.log('Signature preview:', signature.substring(0, 50) + '...' + signature.substring(signature.length - 50));
    console.log('======================');
    
    return signature;
  }

  /**
   * Get OAuth2 access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.authUrl}/connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'payments',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration 1 minute before actual expiry for safety
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
      
      return this.accessToken;
    } catch (error: any) {
      console.error('TrueLayer auth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with TrueLayer');
    }
  }

  /**
   * Create a payment with TrueLayer
   * Returns payment object with hosted payment page URL
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<TrueLayerPaymentResponse> {
    try {
      const requestBody = {
        amount_in_minor: paymentData.amount * 100, // Convert to minor units (pence/cents)
        currency: paymentData.currency.toUpperCase(),
        payment_method: {
          type: 'bank_transfer',
          provider_selection: {
            type: 'user_selected',
          },
          beneficiary: {
            type: 'external_account',
            account_holder_name: 'Test Merchant',
            account_identifier: {
              type: 'sort_code_account_number',
              sort_code: '123456',
              account_number: '12345678',
            },
            reference: paymentData.reference,
          },
        },
        user: {
          id: crypto.randomUUID(), // Generate unique user ID (UUID format required)
          name: 'Test User',
          email: 'test@example.com',
          date_of_birth: '1990-01-01', // Required for non-regulated accounts
          address: {
            address_line1: '1 Test Street',
            city: 'London',
            state: 'London',
            zip: 'EC1A 1BB',
            country_code: 'GB',
          },
        },
      };

      console.log('Creating TrueLayer payment with request:', JSON.stringify(requestBody, null, 2));
      
      // Generate idempotency key (UUIDv4)
      const idempotencyKey = crypto.randomUUID();
      console.log('Idempotency-Key:', idempotencyKey);
      
      // Generate request signature with idempotency key
      const signature = await this.signRequest('POST', '/v3/payments', requestBody, idempotencyKey);
      console.log('Request signature generated');
      
      const response = await this.axiosInstance.post('/v3/payments', requestBody, {
        headers: {
          'Tl-Signature': signature,
          'Idempotency-Key': idempotencyKey,
        },
      });

      const payment = response.data;
      
      console.log('TrueLayer payment created successfully:', payment.id);
      console.log('TrueLayer payment response:', JSON.stringify(payment, null, 2));
      
      // Build the hosted payment page URL
      // TrueLayer HPP format uses hash fragment, not query params
      if (payment.resource_token && payment.id) {
        payment.hosted_payments_page_url = `https://payment.truelayer-sandbox.com/payments#payment_id=${payment.id}&resource_token=${payment.resource_token}&return_uri=${encodeURIComponent('http://localhost:5173/dashboard')}`;
      }

      return payment;
    } catch (error: any) {
      console.error('TrueLayer create payment error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw new Error(error.response?.data?.title || 'Failed to create payment');
    }
  }

  /**
   * Test signature validation using TrueLayer's test endpoint
   * Returns true if signature is valid (204 response), false otherwise
   */
  async testSignature(): Promise<boolean> {
    try {
      const testBody = {
        test: "signature validation"
      };
      
      const idempotencyKey = crypto.randomUUID();
      console.log('Testing signature with /test-signature endpoint');
      
      const signature = await this.signRequest('POST', '/test-signature', testBody, idempotencyKey);
      
      const response = await this.axiosInstance.post('/test-signature', testBody, {
        headers: {
          'Tl-Signature': signature,
          'Idempotency-Key': idempotencyKey,
        },
      });
      
      console.log('Test signature response status:', response.status);
      return response.status === 204;
    } catch (error: any) {
      console.error('Test signature error:', JSON.stringify(error.response?.data, null, 2) || error.message);
      console.error('Test signature status:', error.response?.status);
      return false;
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<TrueLayerPaymentResponse> {
    try {
      const response = await this.axiosInstance.get(`/v3/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('TrueLayer get payment error:', error.response?.data || error.message);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * List all payments (if supported by TrueLayer)
   * Note: TrueLayer v3 API may not support listing payments directly
   */
  async listPayments(): Promise<TrueLayerPaymentResponse[]> {
    try {
      const response = await this.axiosInstance.get('/v3/payments');
      return response.data.items || [];
    } catch (error: any) {
      // If listing is not supported, return empty array
      console.warn('TrueLayer list payments not supported:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export const trueLayerService = new TrueLayerService();
