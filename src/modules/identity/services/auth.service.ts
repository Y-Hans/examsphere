import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repositories/user.repository';
import { ConflictError, ValidationError, NotFoundError, AppError } from '@/server/shared/errors';
import { prisma } from '@/server/infrastructure/prisma/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  examTarget: z.enum(['JEE_MAIN', 'JEE_ADVANCED', 'NEET']),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export class AuthService {
  async register(input: RegisterInput) {
    const validated = registerSchema.parse(input);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered', 'email');
    }

    // Generate subdomain from email (simplified for individual users)
    const subdomain = validated.email.split('@')[0].toLowerCase() + '-ind';
    
    // Ensure subdomain is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain },
    });
    if (existingTenant) {
      throw new ConflictError('Subdomain conflict, please use a different email', 'email');
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const { user, tenant } = await userRepository.createUserWithTenant({
      email: validated.email,
      passwordHash,
      name: validated.name,
      tenantName: `${validated.name}'s Workspace`,
      subdomain,
    });

    // Assign exam target
    const exam = await prisma.exam.findUnique({
      where: { code: validated.examTarget },
    });
    if (exam) {
      await prisma.user.update({
        where: { id: user.id },
        data: { /* store exam target in user profile/settings if needed, or use a separate table */ },
      });
    }

    return { user, tenant };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        tenantId: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }
}

export const authService = new AuthService();