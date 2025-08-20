import { Prisma } from '../generated/prisma';
import { prisma } from './index';
/**
 * Generic database operation wrapper with error handling
 */
export async function executeDbOperation(operation) {
    try {
        const data = await operation();
        return { success: true, data };
    }
    catch (error) {
        console.error('Database operation failed:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle known Prisma errors
            switch (error.code) {
                case 'P2002':
                    return { success: false, error: 'A record with this data already exists' };
                case 'P2025':
                    return { success: false, error: 'Record not found' };
                case 'P2003':
                    return { success: false, error: 'Foreign key constraint failed' };
                default:
                    return { success: false, error: `Database error: ${error.message}` };
            }
        }
        return { success: false, error: 'An unexpected database error occurred' };
    }
}
/**
 * Generic pagination helper
 */
export function createPaginationQuery(options) {
    const { page, limit, sortBy, sortOrder } = options;
    return {
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined,
    };
}
/**
 * Create paginated result
 */
export function createPaginatedResult(data, total, options) {
    const { page, limit } = options;
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
/**
 * Transaction wrapper for multiple operations
 */
export async function executeTransaction(operations) {
    return executeDbOperation(async () => {
        return await prisma.$transaction(operations);
    });
}
/**
 * Health check for database connection
 */
export async function healthCheck() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
/**
 * Soft delete helper (if needed in the future)
 */
export function createSoftDeleteQuery(isDeleted = false) {
    return {
        where: {
            deletedAt: isDeleted ? { not: null } : null,
        },
    };
}
/**
 * Search helper for text fields
 */
export function createSearchQuery(searchTerm, fields) {
    if (!searchTerm.trim())
        return {};
    return {
        OR: fields.map(field => ({
            [field]: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        })),
    };
}
