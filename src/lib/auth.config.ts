import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/server/infrastructure/prisma/client';
import { env } from '@/lib/env';

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/);

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Track failed login attempts
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authConfig = {
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID || '',
      clientSecret: env.AUTH_GOOGLE_SECRET || '',
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Check account lockout
        const attemptData = failedAttempts.get(email);
        if (attemptData && attemptData.lockedUntil > Date.now()) {
          return null; // Account is locked
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            tenant: true,
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          // Increment failed attempts
          const currentAttempts = failedAttempts.get(email);
          const newCount = (currentAttempts?.count || 0) + 1;
          if (newCount >= MAX_FAILED_ATTEMPTS) {
            failedAttempts.set(email, { count: newCount, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
          } else {
            failedAttempts.set(email, { count: newCount, lockedUntil: 0 });
          }
          return null;
        }

        // Reset failed attempts on successful login
        failedAttempts.delete(email);

        return {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          tenantSubdomain: user.tenant.subdomain,
          roleIds: user.roles.map((ur) => ur.roleId),
          permissions: user.roles.flatMap((ur) => 
            ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
          ),
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnApp = nextUrl.pathname.startsWith('/app') || 
                      nextUrl.pathname.startsWith('/student') || 
                      nextUrl.pathname.startsWith('/teacher') || 
                      nextUrl.pathname.startsWith('/institute') || 
                      nextUrl.pathname.startsWith('/super-admin');
      
      if (isOnApp) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      
      if (isLoggedIn && (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register'))) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.tenantSubdomain = user.tenantSubdomain;
        token.roleIds = user.roleIds;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSubdomain = token.tenantSubdomain as string;
        session.user.roleIds = token.roleIds as string[];
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
