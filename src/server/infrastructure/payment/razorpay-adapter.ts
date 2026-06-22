import { BasePaymentGateway, PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest } from './payment-gateway';
import crypto from 'crypto';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'RazorpayAdapter' });

export class RazorpayAdapter extends BasePaymentGateway {
  name = 'RAZORPAY';
  private baseUrl = 'https://api.razorpay.com/v1';

  constructor() {
    super({
      apiKey: env.RAZORPAY_KEY_ID || '',
      apiSecret: env.RAZORPAY_KEY_SECRET || '',
    });
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.apiSecret;
  }

  async initializePayment(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    if (!this.isAvailable()) throw new Error('Razorpay credentials not configured');

    const orderData = {
      amount: Math.round(request.amountInr * 100), // Convert to paise
      currency: 'INR',
      receipt: `sub_${request.userId}_${Date.now()}`,
      notes: {
        userId: request.userId,
        planId: request.planId,
      },
    };

    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const err = await response.text();
      log.error({ err }, 'Razorpay order creation failed');
      throw new Error('Failed to initialize payment');
    }

    const order = await response.json();

    return {
      paymentId: order.id,
      gateway: this.name,
      checkoutUrl: `https://api.razorpay.com/v1/checkout/embedded?order_id=${order.id}&key_id=${this.apiKey}`,
    };
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<boolean> {
    // Razorpay signature verification is typically done via webhook,
    // but can be done manually if needed.
    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(`${request.orderId}|${request.paymentId}`)
      .digest('hex');
    
    return expectedSignature === request.signature;
  }

  async handleWebhook(payload: any, signature: string): Promise<{ verified: boolean; event: string }> {
    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      return { verified: false, event: 'INVALID_SIGNATURE' };
    }

    return { verified: true, event: payload.event };
  }
}