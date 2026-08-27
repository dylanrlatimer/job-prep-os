/** `message` is an i18n lookup key under `Errors`, never user-facing English. */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR', options?: ErrorOptions) {
    super(message, options);
    this.status = status;
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'UNAUTHENTICATED', options?: ErrorOptions) {
    super(message, 401, 'UNAUTHENTICATED', options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'NOT_FOUND', options?: ErrorOptions) {
    super(message, 404, 'NOT_FOUND', options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'FORBIDDEN', options?: ErrorOptions) {
    super(message, 403, 'FORBIDDEN', options);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'DATABASE_ERROR', options?: ErrorOptions) {
    super(message, 500, 'DATABASE_ERROR', options);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
