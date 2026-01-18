import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import paymentsRouter from './routes/payments.js';
import { checkJwt, handleAuthError } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test signature endpoint (no auth required)
app.get('/api/payments/test-signature', async (req, res) => {
  try {
    console.log('Testing TrueLayer signature...');
    const { trueLayerService } = await import('./services/truelayer.js');
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

// Protected API routes
app.use('/api/payments', checkJwt, paymentsRouter);

// Error handling - must be AFTER routes
app.use(handleAuthError);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== ERROR ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Full error:', err);
  console.error('=============');
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment Dashboard API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth0 Domain: ${process.env.AUTH0_DOMAIN}`);
  console.log(`💳 TrueLayer Mode: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Sandbox'}`);
  console.log('\nReady to accept requests!');
});

export default app;
