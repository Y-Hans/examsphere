import { NextResponse } from 'next/server';
import { prisma } from '@/server/infrastructure/prisma/client';

export async function GET() {
  try {
    // Simple DB connectivity check
    await prisma.$queryRaw`SELECT 1 FROM DUAL`;
    return NextResponse.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected', error: 'DB connection failed' },
      { status: 503 }
    );
  }
}