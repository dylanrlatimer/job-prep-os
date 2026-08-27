import { ApiClientError } from '@/lib/errors/api-client-error';

function isCamelCase(value: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(value);
}

function isScreamingSnake(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

export function resolveApiErrorToastKey(error: ApiClientError): string {
  if (error.code === 'VALIDATION_ERROR') return `validation.${error.message}`;
  if (error.code === 'NOT_FOUND' && isCamelCase(error.message)) return error.message;
  if (error.code === 'FORBIDDEN' && isCamelCase(error.message)) return error.message;
  if (['FORBIDDEN', 'CONFLICT'].includes(error.code) && isScreamingSnake(error.message)) return error.message;
  return error.code;
}
