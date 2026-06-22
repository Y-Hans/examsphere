export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public field?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, field, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` with id ${id}` : ''} not found`, 404);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super('CONFLICT_ERROR', message, 409, field);
  }
}

export class TenantError extends AppError {
  constructor(message: string = 'Tenant context error') {
    super('TENANT_ERROR', message, 400);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super('RATE_LIMIT_ERROR', message, 429);
  }
}