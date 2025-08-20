// Application optimization configuration
export const OPTIMIZATION_CONFIG = {
  // Performance settings
  performance: {
    // Cache settings
    cache: {
      exchangeRates: {
        ttl: 3600000, // 1 hour
        maxSize: 1000
      },
      apiResponses: {
        ttl: 300000, // 5 minutes
        maxSize: 500
      },
      calculations: {
        ttl: 60000, // 1 minute
        maxSize: 100
      }
    },
    
    // Batch processing settings
    batch: {
      apiRequests: {
        windowMs: 50, // 50ms batch window
        maxBatchSize: 10
      },
      calculations: {
        windowMs: 100, // 100ms batch window
        maxBatchSize: 50
      }
    },
    
    // Debounce settings
    debounce: {
      currencyConversion: 300, // 300ms
      invoiceCalculation: 100, // 100ms
      apiCalls: 500 // 500ms
    },
    
    // Throttle settings
    throttle: {
      exchangeRateUpdates: 60000, // 1 minute
      performanceLogging: 5000, // 5 seconds
      errorReporting: 10000 // 10 seconds
    }
  },
  
  // Security settings
  security: {
    // Rate limiting
    rateLimits: {
      authentication: {
        windowMs: 900000, // 15 minutes
        maxRequests: 5
      },
      payments: {
        windowMs: 60000, // 1 minute
        maxRequests: 10
      },
      api: {
        windowMs: 60000, // 1 minute
        maxRequests: 100
      },
      currencyRates: {
        windowMs: 3600000, // 1 hour
        maxRequests: 60
      }
    },
    
    // Session settings
    session: {
      maxAge: 86400000, // 24 hours
      renewThreshold: 3600000, // 1 hour before expiry
      cleanupInterval: 300000 // 5 minutes
    },
    
    // Input validation
    validation: {
      maxStringLength: 1000,
      maxArrayLength: 100,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg']
    },
    
    // Encryption settings
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 2592000000, // 30 days
      saltRounds: 12
    }
  },
  
  // Database optimization
  database: {
    // Connection pool settings
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    
    // Query optimization
    queries: {
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      batchSize: 100
    },
    
    // Pagination settings
    pagination: {
      defaultLimit: 50,
      maxLimit: 100,
      defaultOffset: 0
    }
  },
  
  // API optimization
  api: {
    // Request settings
    requests: {
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      maxConcurrent: 10
    },
    
    // Response settings
    responses: {
      compression: true,
      cacheControl: 'public, max-age=300', // 5 minutes
      etag: true
    },
    
    // External API settings
    external: {
      exchangeRates: {
        timeout: 10000, // 10 seconds
        retries: 2,
        cacheTtl: 3600000 // 1 hour
      },
      payments: {
        timeout: 30000, // 30 seconds
        retries: 1,
        cacheTtl: 0 // No caching for payments
      }
    }
  },
  
  // Frontend optimization
  frontend: {
    // Bundle settings
    bundle: {
      splitChunks: true,
      lazyLoading: true,
      preloading: ['critical-css', 'fonts']
    },
    
    // Image optimization
    images: {
      formats: ['webp', 'avif', 'png', 'jpg'],
      quality: 85,
      sizes: [640, 768, 1024, 1280, 1920],
      lazy: true
    },
    
    // Component optimization
    components: {
      memoization: true,
      virtualScrolling: {
        enabled: true,
        itemHeight: 50,
        overscan: 5
      }
    }
  },
  
  // Monitoring settings
  monitoring: {
    // Performance monitoring
    performance: {
      enabled: true,
      sampleRate: 0.1, // 10% sampling
      slowThreshold: 1000, // 1 second
      memoryThreshold: 0.8 // 80% memory usage
    },
    
    // Error monitoring
    errors: {
      enabled: true,
      maxErrors: 1000,
      cleanupInterval: 3600000, // 1 hour
      alertThreshold: 10 // errors per minute
    },
    
    // Security monitoring
    security: {
      enabled: true,
      maxEvents: 10000,
      cleanupInterval: 86400000, // 24 hours
      alertSeverities: ['high', 'critical']
    }
  },
  
  // Feature flags
  features: {
    multiCurrency: {
      enabled: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'],
      defaultCurrency: 'USD'
    },
    
    recurringInvoices: {
      enabled: true,
      maxRecurring: 100,
      frequencies: ['weekly', 'monthly', 'quarterly', 'yearly']
    },
    
    clientPortal: {
      enabled: true,
      registrationEnabled: true,
      paymentEnabled: true
    },
    
    payments: {
      enabled: true,
      providers: ['stripe', 'paypal'],
      currencies: ['USD', 'EUR', 'GBP']
    },
    
    analytics: {
      enabled: true,
      trackingId: process.env.ANALYTICS_ID,
      anonymizeIp: true
    }
  }
};

// Environment-specific overrides
export const getOptimizationConfig = () => {
  const config = { ...OPTIMIZATION_CONFIG };
  
  // Development overrides
  if (process.env.NODE_ENV === 'development') {
    config.performance.cache.exchangeRates.ttl = 60000; // 1 minute in dev
    config.security.rateLimits.api.maxRequests = 1000; // Higher limits in dev
    config.monitoring.performance.sampleRate = 1.0; // 100% sampling in dev
  }
  
  // Production overrides
  if (process.env.NODE_ENV === 'production') {
    config.security.session.maxAge = 43200000; // 12 hours in production
    config.monitoring.performance.sampleRate = 0.01; // 1% sampling in production
    config.api.responses.cacheControl = 'public, max-age=3600'; // 1 hour cache
  }
  
  // Test overrides
  if (process.env.NODE_ENV === 'test') {
    config.performance.cache.exchangeRates.ttl = 1000; // 1 second in tests
    config.security.rateLimits.authentication.maxRequests = 1000; // No limits in tests
    config.monitoring.performance.enabled = false; // Disable monitoring in tests
  }
  
  return config;
};

// Utility functions for accessing config
export const getPerformanceConfig = () => getOptimizationConfig().performance;
export const getSecurityConfig = () => getOptimizationConfig().security;
export const getDatabaseConfig = () => getOptimizationConfig().database;
export const getApiConfig = () => getOptimizationConfig().api;
export const getFrontendConfig = () => getOptimizationConfig().frontend;
export const getMonitoringConfig = () => getOptimizationConfig().monitoring;
export const getFeatureFlags = () => getOptimizationConfig().features;

// Configuration validation
export const validateConfig = (config: typeof OPTIMIZATION_CONFIG): boolean => {
  try {
    // Validate required fields
    if (!config.performance || !config.security || !config.database) {
      throw new Error('Missing required configuration sections');
    }
    
    // Validate numeric values
    if (config.performance.cache.exchangeRates.ttl <= 0) {
      throw new Error('Invalid cache TTL value');
    }
    
    if (config.security.rateLimits.api.maxRequests <= 0) {
      throw new Error('Invalid rate limit value');
    }
    
    // Validate arrays
    if (!Array.isArray(config.features.multiCurrency.supportedCurrencies)) {
      throw new Error('Supported currencies must be an array');
    }
    
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// Export default configuration
export default getOptimizationConfig();