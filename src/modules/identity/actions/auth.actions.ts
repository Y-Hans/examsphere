'use server';

import { auth, signIn, signOut } from '@/lib/auth';
import { AuthService, RegisterInput } from '../services/auth.service';
import { AppError, AuthorizationError } from '@/server/shared/errors';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';

const authService = new AuthService();

export async function registerUser(formData: FormData) {
  try {
    const input: RegisterInput = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      examTarget: formData.get('examTarget') as 'JEE_MAIN' | 'JEE_ADVANCED' | 'NEET',
    };

    const result = await authService.register(input);
    
    // Automatically sign in the user after registration
    await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    return { success: true, data: { userId: result.user.id, tenantId: result.tenant.id } };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message, field: error.field } };
    }
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn('credentials', { email, password, redirect: false });
    return { success: true };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, error: { code: error.code, message: error.message } };
    }
    return { success: false, error: { code: 'AUTH_ERROR', message: 'Invalid email or password' } };
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  return { success: true };
}

import { withContext } from '@/server/shared/action-context';