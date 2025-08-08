import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the interval
}

interface RequestLog {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const requestLogs = new Map<string, RequestLog>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, log] of requestLogs.entries()) {
    if (log.resetTime < now) {
      requestLogs.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function rateLimit(config: RateLimitConfig = { interval: 60000, maxRequests: 10 }) {
  return async (request: NextRequest, identifier?: string) => {
    // Get identifier (IP address or user ID)
    const id = identifier || 
               request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous'
    
    const now = Date.now()
    const log = requestLogs.get(id)
    
    if (!log || log.resetTime < now) {
      // Create new log entry
      requestLogs.set(id, {
        count: 1,
        resetTime: now + config.interval
      })
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.interval }
    }
    
    if (log.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((log.resetTime - now) / 1000)
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: log.resetTime,
        retryAfter 
      }
    }
    
    // Increment count
    log.count++
    requestLogs.set(id, log)
    
    return { 
      allowed: true, 
      remaining: config.maxRequests - log.count,
      resetTime: log.resetTime 
    }
  }
}

// Preset rate limiters for different endpoints
export const rateLimiters = {
  // Standard API calls: 30 requests per minute
  standard: rateLimit({ interval: 60000, maxRequests: 30 }),
  
  // Heavy operations (PDF processing): 5 requests per minute
  heavy: rateLimit({ interval: 60000, maxRequests: 5 }),
  
  // Auth endpoints: 10 attempts per 15 minutes
  auth: rateLimit({ interval: 900000, maxRequests: 10 }),
  
  // Image processing: 10 requests per minute
  image: rateLimit({ interval: 60000, maxRequests: 10 })
}