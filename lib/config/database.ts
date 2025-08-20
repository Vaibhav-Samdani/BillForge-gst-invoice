// Database configuration and environment variables

export const databaseConfig = {
  // Database URL from environment
  url: process.env.DATABASE_URL,
  
  // Connection pool settings
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
  
  // Query settings
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  
  // SSL settings for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Logging configuration
  logging: {
    enabled: process.env.DB_LOGGING === 'true',
    level: process.env.DB_LOG_LEVEL || 'error'
  }
};

// Validate required environment variables
export function validateDatabaseConfig(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Additional validation can be added here
  console.log('✅ Database configuration validated');
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { prisma } = await import('../db');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}