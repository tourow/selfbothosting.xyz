import { NextRequest, NextResponse } from 'next/server';

const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;

export function checkRateLimit(request: NextRequest): { allowed: boolean; response?: NextResponse } {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const now = Date.now();
  const limiter = rateLimiter.get(ip);
  
  if (limiter && now < limiter.resetTime) {
    if (limiter.count >= RATE_LIMIT_MAX) {
      return {
        allowed: false,
        response: NextResponse.json(
          { success: false, error: 'Rate limit exceeded' },
          { status: 429 }
        ),
      };
    }
    limiter.count++;
  } else {
    rateLimiter.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
  }
  
  return { allowed: true };
}
