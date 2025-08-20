// Security configuration for the application
export const securityConfig = {
  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // days
    preventReuse: 5, // last N passwords
  },

  // Session configuration
  session: {
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    renewThreshold: 15 * 60, // Renew if less than 15 minutes remaining
    maxConcurrentSessions: 3,
    requireReauthForSensitive: true,
  },

  // Rate limiting configuration
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      blockDuration: 15 * 60 * 1000, // 15 minutes
    },
    payment: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 10,
      blockDuration: 5 * 60 * 1000, // 5 minutes
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 100,
      blockDuration: 60 * 1000, // 1 minute
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3,
      blockDuration: 60 * 60 * 1000, // 1 hour
    },
  },

  // Request size limits
  requestLimits: {
    auth: 1024, // 1KB
    payment: 10 * 1024, // 10KB
    invoice: 100 * 1024, // 100KB
    fileUpload: 10 * 1024 * 1024, // 10MB
    general: 50 * 1024, // 50KB
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
    backupEncryption: true,
    encryptSensitiveFields: [
      'email',
      'phone',
      'address',
      'paymentMethod',
      'bankAccount',
      'gstin',
    ],
  },

  // CORS settings
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? [
          'https://yourdomain.com',
          'https://www.yourdomain.com',
        ]
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ],
    allowCredentials: true,
    maxAge: 86400, // 24 hours
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Next.js in development
      "'unsafe-eval'", // Required for Next.js in development
      'https://js.stripe.com',
      'https://checkout.stripe.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and CSS-in-JS
      'https://fonts.googleapis.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    connectSrc: [
      "'self'",
      'https://api.exchangerate-api.com',
      'https://api.stripe.com',
      'https://checkout.stripe.com',
    ],
    frameSrc: [
      'https://js.stripe.com',
      'https://hooks.stripe.com',
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production',
  },

  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined,
  },

  // File upload security
  fileUpload: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    scanForMalware: process.env.NODE_ENV === 'production',
    quarantineDirectory: '/tmp/quarantine',
  },

  // Audit and monitoring
  audit: {
    logSecurityEvents: true,
    logFailedAttempts: true,
    logSuccessfulAuth: true,
    logDataAccess: process.env.NODE_ENV === 'production',
    retentionDays: 90,
    alertThresholds: {
      failedLogins: 10, // per hour
      suspiciousRequests: 50, // per hour
      rateLimitExceeded: 100, // per hour
    },
  },

  // Data protection
  dataProtection: {
    encryptAtRest: true,
    encryptInTransit: true,
    dataMinimization: true,
    rightToErasure: true,
    dataPortability: true,
    consentRequired: true,
    cookieConsent: true,
    privacyPolicyRequired: true,
  },

  // API security
  api: {
    requireApiKey: false, // Set to true for external API access
    apiKeyHeader: 'X-API-Key',
    versioningRequired: true,
    deprecationWarnings: true,
    requestIdTracking: true,
  },

  // Development vs Production differences
  development: {
    disableCSRF: false, // Keep CSRF protection even in development
    allowInsecureConnections: true,
    verboseLogging: true,
    skipRateLimiting: false, // Keep rate limiting in development
  },

  production: {
    enforceHTTPS: true,
    strictCSP: true,
    enableHSTS: true,
    requireSecureCookies: true,
    enableSecurityHeaders: true,
  },
}

// Environment-specific configuration
export const getSecurityConfig = () => {
  const baseConfig = { ...securityConfig }
  
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      ...baseConfig.development,
    }
  }
  
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      ...baseConfig.production,
    }
  }
  
  return baseConfig
}

// Security constants
export const SECURITY_CONSTANTS = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  RESET_TOKEN_EXPIRY: 60 * 60, // 1 hour
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours
  
  // Encryption key sizes
  AES_KEY_SIZE: 256,
  RSA_KEY_SIZE: 2048,
  HMAC_KEY_SIZE: 256,
  
  // Hash rounds
  BCRYPT_ROUNDS: 12,
  PBKDF2_ITERATIONS: 100000,
  
  // Security event types
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT: 'logout',
    PASSWORD_CHANGE: 'password_change',
    ACCOUNT_LOCKED: 'account_locked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    DATA_ACCESS: 'data_access',
    PERMISSION_DENIED: 'permission_denied',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    CSRF_VIOLATION: 'csrf_violation',
    XSS_ATTEMPT: 'xss_attempt',
    SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  },
  
  // Risk levels
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
} as const

export type SecurityEvent = keyof typeof SECURITY_CONSTANTS.SECURITY_EVENTS
export type RiskLevel = keyof typeof SECURITY_CONSTANTS.RISK_LEVELS