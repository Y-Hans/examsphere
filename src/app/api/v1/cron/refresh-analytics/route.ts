import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/infrastructure/prisma/client';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Refresh materialized views
    await prisma.$executeRaw`BEGIN DBMS_MVIEW.REFRESH('mv_user_topic_accuracy'); END;`;
    await prisma.$executeRaw`BEGIN DBMS_MVIEW.REFRESH('mv_question_usage_stats'); END;`;
    await prisma.$executeRaw`BEGIN DBMS_MVIEW.REFRESH('mv_tenant_daily_active'); END;`;

    return NextResponse.json({ success: true, message: 'Analytics materialized views refreshed.' });
  } catch (error) {
    console.error('Cron: Failed to refresh analytics:', error);
    return NextResponse.json({ error: 'Failed to refresh analytics' }, { status: 500 });
  }
}
