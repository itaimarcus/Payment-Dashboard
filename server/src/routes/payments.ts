import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, getUserId } from '../middleware/auth.js';
import { trueLayerService } from '../services/truelayer.js';
import * as paymentsRepo from '../db/payments.repository.js';
import { Payment, CreatePaymentRequest, PaymentStatus } from '../types/payment.js';

const router = Router();

/**
 * POST /api/payments
 * Create a new payment
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const paymentRequest: CreatePaymentRequest = req.body;

    // Validate request body
    if (!paymentRequest.amount || !paymentRequest.currency || !paymentRequest.reference) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Missing required fields: amount, currency, reference',
      });
    }

    if (paymentRequest.amount <= 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Amount must be greater than 0',
      });
    }

    // Create payment with TrueLayer
    const trueLayerPayment = await trueLayerService.createPayment(paymentRequest);

    // Store payment in database
    const payment: Payment = {
      userId,
      paymentId: trueLayerPayment.id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency.toUpperCase(),
      status: trueLayerPayment.status,
      reference: paymentRequest.reference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentLink: trueLayerPayment.hosted_payments_page_url,
      trueLayerData: trueLayerPayment,
    };

    await paymentsRepo.createPayment(payment);

    res.status(201).json(payment);
  } catch (error: any) {
    console.error('Create payment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to create payment',
    });
  }
});

/**
 * GET /api/payments
 * List all payments for the authenticated user
 * Query params: ?status=authorized (optional)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📥 GET /api/payments - Request received');
    console.log('   Auth header present:', !!req.headers.authorization);
    console.log('   Auth object:', req.auth ? 'Present' : 'MISSING');
    console.log('   User sub:', req.auth?.sub || 'MISSING');
    
    const userId = getUserId(req);
    console.log('   Extracted userId:', userId);
    
    const status = req.query.status as PaymentStatus | undefined;
    console.log('   Status filter:', status || 'none');

    console.log('   Querying DynamoDB...');
    const payments = await paymentsRepo.listPayments(userId, status);
    console.log('✅ Query successful, payments found:', payments.length);

    res.json(payments);
  } catch (error: any) {
    console.error('❌ List payments error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch payments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/payments/search
 * Search payments by reference or amount
 * Query params: ?q=search-term
 */
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const searchTerm = req.query.q as string;

    if (!searchTerm) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Search term is required',
      });
    }

    const payments = await paymentsRepo.searchPayments(userId, searchTerm);

    res.json(payments);
  } catch (error: any) {
    console.error('Search payments error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to search payments',
    });
  }
});

/**
 * GET /api/payments/stats
 * Get payment statistics for graphs
 * Query params: ?days=7 (default)
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days as string) || 7;

    const payments = await paymentsRepo.getPaymentStats(userId, days);

    // Group by date and calculate totals
    const statsByDate = payments.reduce((acc: any, payment) => {
      const date = payment.createdAt.split('T')[0]; // Extract date part
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0, currency: payment.currency };
      }
      if (payment.status === 'executed' || payment.status === 'authorized') {
        acc[date].total += payment.amount;
        acc[date].count += 1;
      }
      return acc;
    }, {});

    const stats = Object.values(statsByDate).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    res.json(stats);
  } catch (error: any) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch payment statistics',
    });
  }
});

/**
 * GET /api/payments/test-signature
 * Test TrueLayer signature validation (no auth required for testing)
 */
router.get('/test-signature', async (req, res: Response) => {
  try {
    console.log('Testing TrueLayer signature...');
    const result = await trueLayerService.testSignature();
    
    res.json({ 
      valid: result,
      message: result ? 'Signature is valid!' : 'Signature validation failed - check logs'
    });
  } catch (error: any) {
    console.error('Test signature route error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to test signature',
    });
  }
});

/**
 * GET /api/payments/:id
 * Get a single payment by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const paymentId = req.params.id;

    // Get payment from database
    const payment = await paymentsRepo.getPayment(userId, paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Payment not found',
      });
    }

    // Optionally fetch latest status from TrueLayer
    try {
      const trueLayerPayment = await trueLayerService.getPayment(paymentId);
      
      // Update status if changed
      if (trueLayerPayment.status !== payment.status) {
        await paymentsRepo.updatePaymentStatus(
          userId,
          paymentId,
          trueLayerPayment.status,
          trueLayerPayment
        );
        payment.status = trueLayerPayment.status;
        payment.trueLayerData = trueLayerPayment;
      }
    } catch (error) {
      console.warn('Failed to fetch latest payment status from TrueLayer:', error);
      // Continue with database data
    }

    res.json(payment);
  } catch (error: any) {
    console.error('Get payment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch payment',
    });
  }
});

export default router;
