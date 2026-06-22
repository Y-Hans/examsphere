import { NextRequest, NextResponse } from 'next/server';
import { RazorpayAdapter } from '@/server/infrastructure/payment/razorpay-adapter';
import { prisma } from '@/server/infrastructure/prisma/client';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'PaymentWebhook' });

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-razorpay-signature') || '';
    const payload = await req.json();

    const razorpay = new RazorpayAdapter();
    if (!razorpay.isAvailable()) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const { verified, event } = await razorpay.handleWebhook(payload, signature);

    if (!verified) {
      log.warn({ event }, 'Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    log.info({ event }, 'Webhook verified successfully');

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const notes = paymentEntity.notes;

      if (notes && notes.userId && notes.planId) {
        await prisma.subscription.updateMany({
          where: { userId: notes.userId, status: 'ACTIVE' },
          data: { status: 'EXPIRED', cancelledAt: new Date() },
        });

        const plan = await prisma.plan.findUnique({ where: { id: notes.planId } });
        if (plan) {
          await prisma.subscription.create({
            data: {
              userId: notes.userId,
              tenantId: notes.tenantId,
              planId: notes.planId,
              status: 'ACTIVE',
              startedAt: new Date(),
              endsAt: plan.billingCycle === 'YEARLY' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
            },
          });
          log.info({ userId: notes.userId, planId: notes.planId }, 'Subscription activated via webhook');
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error({ error }, 'Webhook processing failed');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}