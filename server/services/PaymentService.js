import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

class PaymentService {
  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
    } else {
      console.warn('⚠️ Stripe not configured - payments will be simulated');
    }
  }

  /**
   * Create a payment intent for ad generation batch
   * @param {Object} options - Payment options
   * @returns {Object} Payment intent details
   */
  async createPaymentIntent(options = {}) {
    try {
      const {
        amount = 50, // $0.50 in cents
        currency = 'usd',
        userId,
        batchId,
        description = 'AdSpark AI - Ad Generation Batch'
      } = options;

      if (!this.stripe) {
        // Simulate payment for development
        return this.simulatePayment({ amount, currency, userId, batchId });
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        description,
        metadata: {
          userId: userId || 'anonymous',
          batchId: batchId || 'unknown',
          service: 'adspark-ai',
          type: 'ad-generation-batch'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(`💳 Payment intent created: ${paymentIntent.id} for $${amount/100}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };

    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Payment confirmation details
   */
  async confirmPayment(paymentIntentId) {
    try {
      if (!this.stripe) {
        // Simulate payment confirmation
        return {
          id: paymentIntentId,
          status: 'succeeded',
          amount: 50,
          currency: 'usd',
          created: Math.floor(Date.now() / 1000)
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        console.log(`✅ Payment confirmed: ${paymentIntentId}`);
        return {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created,
          metadata: paymentIntent.metadata
        };
      } else {
        throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
      }

    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Object} Processing result
   */
  async handleWebhookEvent(event) {
    try {
      console.log(`🔔 Webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSuccess(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailure(event.data.object);
        
        case 'payment_intent.canceled':
          return await this.handlePaymentCancellation(event.data.object);
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return { processed: false, reason: 'Unhandled event type' };
      }

    } catch (error) {
      console.error('❌ Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(paymentIntent) {
    try {
      const { userId, batchId } = paymentIntent.metadata || {};
      
      console.log(`✅ Payment succeeded for user ${userId}, batch ${batchId}`);
      
      // Here you would typically:
      // 1. Update the ad batch status to 'paid'
      // 2. Trigger ad generation process
      // 3. Send confirmation email
      // 4. Update user's payment history
      
      return {
        processed: true,
        action: 'payment_success',
        userId,
        batchId,
        amount: paymentIntent.amount
      };

    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(paymentIntent) {
    try {
      const { userId, batchId } = paymentIntent.metadata || {};
      
      console.log(`❌ Payment failed for user ${userId}, batch ${batchId}`);
      
      // Here you would typically:
      // 1. Update the ad batch status to 'payment_failed'
      // 2. Send failure notification
      // 3. Log the failure for analysis
      
      return {
        processed: true,
        action: 'payment_failure',
        userId,
        batchId,
        reason: paymentIntent.last_payment_error?.message || 'Unknown error'
      };

    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Handle payment cancellation
   */
  async handlePaymentCancellation(paymentIntent) {
    try {
      const { userId, batchId } = paymentIntent.metadata || {};
      
      console.log(`🚫 Payment canceled for user ${userId}, batch ${batchId}`);
      
      return {
        processed: true,
        action: 'payment_canceled',
        userId,
        batchId
      };

    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified event
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return event;

    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get payment history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of payments to retrieve
   * @returns {Array} Payment history
   */
  async getPaymentHistory(userId, limit = 10) {
    try {
      if (!this.stripe) {
        return []; // Return empty array if Stripe not configured
      }

      const paymentIntents = await this.stripe.paymentIntents.list({
        limit,
        expand: ['data.charges'],
      });

      // Filter by user ID in metadata
      const userPayments = paymentIntents.data
        .filter(pi => pi.metadata?.userId === userId)
        .map(pi => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: pi.created,
          description: pi.description,
          metadata: pi.metadata
        }));

      return userPayments;

    } catch (error) {
      console.error('❌ Error retrieving payment history:', error);
      throw new Error('Failed to retrieve payment history');
    }
  }

  /**
   * Simulate payment for development/testing
   */
  simulatePayment(options) {
    const { amount, currency, userId, batchId } = options;
    
    console.log(`🧪 Simulating payment: $${amount/100} ${currency.toUpperCase()} for user ${userId}`);
    
    return {
      clientSecret: `pi_simulated_${Date.now()}_secret`,
      paymentIntentId: `pi_simulated_${Date.now()}`,
      amount,
      currency,
      status: 'requires_payment_method',
      simulated: true
    };
  }

  /**
   * Calculate pricing for different batch sizes
   * @param {number} variationCount - Number of ad variations
   * @returns {Object} Pricing details
   */
  calculatePricing(variationCount = 4) {
    const basePrice = 50; // $0.50 in cents
    const pricePerVariation = 12; // $0.12 per additional variation beyond 4
    
    let totalPrice = basePrice;
    if (variationCount > 4) {
      totalPrice += (variationCount - 4) * pricePerVariation;
    }

    return {
      basePrice,
      variationCount,
      pricePerVariation,
      totalPrice,
      totalPriceFormatted: `$${(totalPrice / 100).toFixed(2)}`,
      savings: variationCount > 4 ? Math.round((variationCount - 4) * 3) : 0 // Savings vs individual pricing
    };
  }

  /**
   * Create a refund for a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Amount to refund (optional, defaults to full amount)
   * @returns {Object} Refund details
   */
  async createRefund(paymentIntentId, amount = null) {
    try {
      if (!this.stripe) {
        return {
          id: `re_simulated_${Date.now()}`,
          amount: amount || 50,
          status: 'succeeded',
          simulated: true
        };
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount || undefined // If amount is null, refund full amount
      });

      console.log(`💰 Refund created: ${refund.id} for $${refund.amount/100}`);

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        created: refund.created
      };

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      throw new Error('Failed to create refund');
    }
  }
}

export default new PaymentService();
