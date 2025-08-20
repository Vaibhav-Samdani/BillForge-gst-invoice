import { PrismaClient } from '../generated/prisma';
// Global variable to store the Prisma client instance
const globalForPrisma = globalThis;
// Create a single instance of PrismaClient
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: ['query', 'error', 'warn'],
    });
// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
export default prisma;
