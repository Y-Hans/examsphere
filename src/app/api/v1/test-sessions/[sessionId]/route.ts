import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/infrastructure/prisma/client';
import { auth } from '@/lib/auth';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { AuthorizationError, NotFoundError } from '@/server/shared/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) throw new AuthorizationError('Session required');

    return UserContext.run(
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        roleIds: session.user.roleIds,
        permissions: session.user.permissions,
      },
      () =>
        TenantContext.run(
          { tenantId: session.user.tenantId, subdomain: session.user.tenantSubdomain },
          async () => {
            const sessionData = await prisma.testSession.findUnique({
              where: { id: params.sessionId },
              include: {
                template: {
                  include: {
                    sections: {
                      orderBy: { orderNo: 'asc' },
                      include: {
                        questions: {
                          orderBy: { orderNo: 'asc' },
                          include: {
                            question: {
                              include: {
                                versions: {
                                  orderBy: { versionNo: 'desc' },
                                  take: 1,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                responses: true,
              },
            });

            if (!sessionData) throw new NotFoundError('TestSession', params.sessionId);
            if (sessionData.userId !== session.user.id) throw new AuthorizationError('Unauthorized');

            return NextResponse.json(sessionData);
          }
        )
    );
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Failed to fetch test session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
