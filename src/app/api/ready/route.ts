import { NextResponse } from 'next/server';
import { prisma } from '@/server/infrastructure/prisma/client';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM DUAL`;
    return NextResponse.json({ status: 'ready' });
  } catch (error) {
    return NextResponse.json({ status: 'not ready' }, { status: 503 });
  }
}
