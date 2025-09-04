import express from 'express';
import PaymentService from '../services/PaymentService.js';
import { AdBatch } from '../models/AdBatch.js';
import { User } from '../models/User.js';

const router = express.Router();

/**
 * POST /api/payments/create-intent
 * Create a payment intent for ad generation
 */
router.post('/create-intent', async (req, res) => {
  try {
    const {
      userId,
      batchId,
      amount = 50, // Default $0.50 in cents
      currency = 'usd'
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify batch exists if provided
    if (batchId) {
      const batch = await AdBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          error: 'Ad batch not found'
        });
      }
    }

    console.log(`💳 Creating payment intent for user ${userId}`);

    const paymentIntent = await PaymentService.createPaymentIntent({
      amount,
      currency,
      userId,
      batchId,
      description: `AdSpark AI - Ad Generation Batch${batchId ? ` (${batchId})` : ''}`
    });

    res.json({
      message: 'Payment intent created successfully',
      paymentIntent
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment
 */
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    console.log(`✅ Confirming payment: ${paymentIntentId}`);

    const paymentConfirmation = await PaymentService.confirmPayment(paymentIntentId);

    // Update user's payment info if needed
    if (paymentConfirmation.metadata?.userId) {
      const user = await User.findById(paymentConfirmation.metadata.userId);
      if (user) {
        const paymentInfo = user.paymentInfo || {};
        paymentInfo.lastPayment = {
          id: paymentConfirmation.id,
          amount: paymentConfirmation.amount,
          currency: paymentConfirmation.currency,
          date: new Date(paymentConfirmation.created * 1000).toISOString()
        };
        await user.update({ paymentInfo });
      }
    }

    res.json({
      message: 'Payment confirmed successfully',
      payment: paymentConfirmation
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        error: 'Missing Stripe signature'
      });
    }

    // Verify webhook signature
    const event = PaymentService.verifyWebhookSignature(req.body, signature);
    
    console.log(`🔔 Processing webhook: ${event.type}`);

    // Handle the event
    const result = await PaymentService.handleWebhookEvent(event);

    // Additional processing based on event type
    if (result.processed && result.action === 'payment_success') {
      // Update ad batch status to paid
      if (result.batchId) {
        const batch = await AdBatch.findById(result.batchId);
        if (batch) {
          await batch.updatePostingStatus('paid');
          console.log(`💰 Ad batch ${result.batchId} marked as paid`);
        }
      }
    }

    res.json({
      message: 'Webhook processed successfully',
      result
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).json({
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/payments/user/:userId/history
 * Get payment history for a user
 */
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const paymentHistory = await PaymentService.getPaymentHistory(userId, parseInt(limit));

    res.json({
      message: 'Payment history retrieved successfully',
      payments: paymentHistory,
      total: paymentHistory.length
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Failed to get payment history',
      message: error.message
    });
  }
});

/**
 * GET /api/payments/pricing
 * Get pricing information
 */
router.get('/pricing', async (req, res) => {
  try {
    const { variationCount = 4 } = req.query;

    const pricing = PaymentService.calculatePricing(parseInt(variationCount));

    res.json({
      message: 'Pricing calculated successfully',
      pricing
    });

  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({
      error: 'Failed to calculate pricing',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/refund
 * Create a refund for a payment
 */
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    console.log(`💰 Creating refund for payment: ${paymentIntentId}`);

    const refund = await PaymentService.createRefund(paymentIntentId, amount);

    // Log the refund reason
    if (reason) {
      console.log(`📝 Refund reason: ${reason}`);
    }

    res.json({
      message: 'Refund created successfully',
      refund
    });

  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({
      error: 'Failed to create refund',
      message: error.message
    });
  }
});

/**
 * POST /api/payments/simulate-success
 * Simulate successful payment (for development/testing)
 */
router.post('/simulate-success', async (req, res) => {
  try {
    const { paymentIntentId, userId, batchId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    console.log(`🧪 Simulating successful payment: ${paymentIntentId}`);

    // Simulate payment success
    const simulatedEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentIntentId,
          amount: 50,
          currency: 'usd',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000),
          metadata: {
            userId: userId || 'test_user',
            batchId: batchId || 'test_batch'
          }
        }
      }
    };

    const result = await PaymentService.handleWebhookEvent(simulatedEvent);

    // Update batch status if provided
    if (batchId) {
      const batch = await AdBatch.findById(batchId);
      if (batch) {
        await batch.updatePostingStatus('paid');
      }
    }

    res.json({
      message: 'Payment simulation completed',
      result,
      simulated: true
    });

  } catch (error) {
    console.error('Simulate payment error:', error);
    res.status(500).json({
      error: 'Failed to simulate payment',
      message: error.message
    });
  }
});

export default router;
