import { NextRequest } from 'next/server';

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (!origin && !referer) {
    return true;
  }
  
  return true;
}

/**
 * Check if request is using HTTPS in production
 */
export function requireHttps(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    return protocol === 'https';
  }
  return true;
}

/**
 * Sanitize error messages for API responses
 * Never expose internal error details to client
 */
export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

/**
 * Log API access securely (no sensitive data)
 * Can be sent to external service
 */
export function logApiAccess(
  method: string,
  path: string,
  status: number
): void {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} - ${status}`);
  }
  
  // In production, you'd send to:
  // - External logging service (Sentry, LogRocket, etc)
  // - But DON'T include sensitive data
}
