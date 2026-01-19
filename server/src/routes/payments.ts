import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, getUserId } from '../middleware/auth.js';
import { trueLayerService } from '../services/truelayer.js';
import * as paymentsRepo from '../db/payments.repository.js';
import { Payment, CreatePaymentRequest, PaymentStatus, TrueLayerPaymentResponse } from '../types/payment.js';

const router = Router();

/**
 * Helper function to map TrueLayer payment response to our internal status
 */
function mapPaymentStatus(trueLayerPayment: TrueLayerPaymentResponse): PaymentStatus {
  // Simply return TrueLayer's status as-is
  // We don't try to distinguish cancellations from failures
  // because TrueLayer treats them the same way
  return trueLayerPayment.status;
}

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
      status: mapPaymentStatus(trueLayerPayment),
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

    // Generate date range (last N days)
    const dateRange: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    // Group by date and currency
    const statsByDateAndCurrency = payments.reduce((acc: any, payment) => {
      const date = payment.createdAt.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, GBP: 0, EUR: 0, count: 0 };
      }
      if (payment.status === 'executed' || payment.status === 'authorized') {
        if (payment.currency === 'GBP') {
          acc[date].GBP += payment.amount;
        } else if (payment.currency === 'EUR') {
          acc[date].EUR += payment.amount;
        }
        acc[date].count += 1;
      }
      return acc;
    }, {});

    // Fill in missing dates with zeros
    const stats = dateRange.map(date => {
      if (statsByDateAndCurrency[date]) {
        return statsByDateAndCurrency[date];
      }
      return { date, GBP: 0, EUR: 0, count: 0 };
    });

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
 * POST /api/payments/:id/refresh-status
 * Refresh payment status from TrueLayer with smart polling
 * This endpoint polls TrueLayer internally until status changes or timeout
 */
router.post('/:id/refresh-status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const paymentId = req.params.id;

    console.log(`🔄 Refreshing status for payment ${paymentId}...`);

    // Get payment from database
    const payment = await paymentsRepo.getPayment(userId, paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Payment not found',
      });
    }

    const originalStatus = payment.status;
    console.log(`   Original status: ${originalStatus}`);

    // Smart polling: Try up to 4 times with 800ms delay between attempts
    const maxAttempts = 4;
    const delayMs = 800;
    let attempt = 1;
    let trueLayerPayment;

    while (attempt <= maxAttempts) {
      try {
        console.log(`   Attempt ${attempt}/${maxAttempts}: Checking TrueLayer...`);
        
        trueLayerPayment = await trueLayerService.getPayment(paymentId);
        const mappedStatus = mapPaymentStatus(trueLayerPayment);
        console.log(`   TrueLayer status: ${trueLayerPayment.status}${trueLayerPayment.failure_reason ? ` (${trueLayerPayment.failure_reason})` : ''} → Mapped: ${mappedStatus}`);
        
        // If status changed from original, we're done!
        if (mappedStatus !== originalStatus) {
          console.log(`   ✅ Status changed from "${originalStatus}" to "${mappedStatus}"`);
          break;
        }
        
        // Status still the same - should we retry?
        if (attempt < maxAttempts) {
          console.log(`   Status still "${originalStatus}", waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempt++;
        } else {
          console.log(`   ℹ️ Status unchanged after ${maxAttempts} attempts`);
          break;
        }
      } catch (error: any) {
        console.error(`   Attempt ${attempt} failed:`, error.message);
        
        // If this was our last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Otherwise, wait and retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempt++;
      }
    }

    // Update database if status changed
    const mappedStatus = trueLayerPayment ? mapPaymentStatus(trueLayerPayment) : payment.status;
    if (trueLayerPayment && mappedStatus !== payment.status) {
      console.log(`   💾 Updating database with new status...`);
      await paymentsRepo.updatePaymentStatus(
        userId,
        paymentId,
        mappedStatus,
        trueLayerPayment
      );
      payment.status = mappedStatus;
      payment.trueLayerData = trueLayerPayment;
      payment.updatedAt = new Date().toISOString();
    } else if (trueLayerPayment && mappedStatus === originalStatus) {
      // Status didn't change after all attempts
      console.log(`   ⚠️ Status still "${originalStatus}" after ${maxAttempts} attempts`);
      // Add metadata to indicate status is still processing
      payment.statusMessage = 'Payment status is still processing. It may take a few moments to update.';
      payment.canRetry = true;
    }

    res.json(payment);
  } catch (error: any) {
    console.error('Refresh payment status error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to refresh payment status from TrueLayer',
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
      const mappedStatus = mapPaymentStatus(trueLayerPayment);
      
      // Update status if changed
      if (mappedStatus !== payment.status) {
        await paymentsRepo.updatePaymentStatus(
          userId,
          paymentId,
          mappedStatus,
          trueLayerPayment
        );
        payment.status = mappedStatus;
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

/**
 * DELETE /api/payments/:id
 * Delete a payment (only unpaid ones)
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const paymentId = req.params.id;

    // Get payment first to check status
    const payment = await paymentsRepo.getPayment(userId, paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Payment not found',
      });
    }

    // Only allow deletion of unpaid payments
    const deletableStatuses = ['authorization_required', 'authorizing', 'failed'];
    if (!deletableStatuses.includes(payment.status)) {
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'Cannot delete paid or completed payments',
      });
    }

    // Delete the payment
    await paymentsRepo.deletePayment(userId, paymentId);

    res.status(204).send(); // 204 No Content
  } catch (error: any) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete payment',
    });
  }
});

export default router;
