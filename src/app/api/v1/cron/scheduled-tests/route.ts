import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/infrastructure/prisma/client';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Activate tests whose scheduled start time has arrived
    const activated = await prisma.testTemplate.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: { lte: now },
      },
      data: { status: 'ACTIVE' },
    });

    // Expire tests whose scheduled end time has passed
    const expired = await prisma.testTemplate.updateMany({
      where: {
        status: 'ACTIVE',
        scheduledEnd: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });

    return NextResponse.json({
      success: true,
      activated: activated.count,
      expired: expired.count,
    });
  } catch (error) {
    console.error('Cron: Failed to process scheduled tests:', error);
    return NextResponse.json({ error: 'Failed to process scheduled tests' }, { status: 500 });
  }
}
