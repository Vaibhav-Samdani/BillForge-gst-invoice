// Authentication configuration
export { auth, signIn, signOut, handlers } from "./config"

// Password utilities
export { 
  hashPassword, 
  verifyPassword, 
  validatePassword 
} from "./password"

// JWT utilities
export {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  generateVerificationToken,
  verifyResetToken,
  isTokenExpired,
  type TokenPayload
} from "./jwt"

// Session management
export {
  getSession,
  getCurrentUser,
  requireAuth,
  getSecureCookieOptions,
  setSecureCookie,
  clearCookie,
  checkRateLimit,
  clearRateLimit,
  type SessionUser
} from "./session"

// Middleware
export {
  withAuth,
  withRole,
  withRateLimit
} from "./middleware"

// Database client functions
export {
  findClientByEmail,
  findClientById,
  createClient,
  verifyClient,
  updateLastLogin,
  setResetToken,
  clearResetToken,
  updateClientPassword,
  type ClientUser
} from "../db/client"

// Environment configuration
export {
  authEnv,
  validateAuthEnv,
  isProduction,
  getBaseUrl
} from "./env"