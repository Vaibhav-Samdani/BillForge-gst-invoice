# Authentication Infrastructure

This directory contains the complete authentication infrastructure for the invoice application, including client portal authentication, session management, and security utilities.

## Features

- **NextAuth.js Integration**: Complete authentication setup with credentials provider
- **Password Security**: bcrypt hashing with 12 rounds for maximum security
- **JWT Token Management**: Access, refresh, reset, and verification tokens
- **Session Management**: Secure session handling with configurable timeouts
- **Rate Limiting**: Built-in protection against brute force attacks
- **Middleware**: Authentication and authorization middleware for API routes
- **Database Integration**: Client user management with Prisma

## Quick Start

### 1. Environment Setup

Ensure these environment variables are set in your `.env` file:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

### 2. Basic Usage

#### Client Registration
```typescript
import { createClient, hashPassword } from "@/lib/auth"

const passwordHash = await hashPassword("userpassword")
const client = await createClient({
  email: "user@example.com",
  passwordHash,
  name: "John Doe",
  company: "Acme Corp"
})
```

#### Authentication in API Routes
```typescript
import { withAuth } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    // User is authenticated, proceed with logic
    return NextResponse.json({ user })
  })
}
```

#### Session Management
```typescript
import { getCurrentUser, requireAuth } from "@/lib/auth"

// Get current user (returns null if not authenticated)
const user = await getCurrentUser()

// Require authentication (throws if not authenticated)
const user = await requireAuth()
```

#### Password Validation
```typescript
import { validatePassword } from "@/lib/auth"

const result = validatePassword("userpassword")
if (!result.isValid) {
  console.log("Password errors:", result.errors)
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Testing
- `GET /api/auth/test` - Test authentication middleware

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character

### Rate Limiting
- 5 failed login attempts per 15 minutes
- Automatic account lockout
- IP-based rate limiting for API endpoints

### Session Security
- Secure HTTP-only cookies
- 24-hour session timeout
- CSRF protection
- Secure cookie settings in production

## Testing

Run the authentication tests:

```bash
npm run test -- lib/auth/__tests__ --run
```

## File Structure

```
lib/auth/
├── config.ts          # NextAuth configuration
├── password.ts        # Password hashing utilities
├── jwt.ts            # JWT token management
├── session.ts        # Session management
├── middleware.ts     # Authentication middleware
├── env.ts           # Environment configuration
├── index.ts         # Main exports
├── README.md        # This file
└── __tests__/       # Test files
    ├── password.test.ts
    └── jwt.test.ts
```

## Database Schema

The authentication system uses these Prisma models:

```prisma
model ClientUser {
  id                  String    @id @default(cuid())
  email               String    @unique
  passwordHash        String
  name                String
  company             String?
  isVerified          Boolean   @default(false)
  verificationToken   String?
  resetToken          String?
  resetTokenExpiry    DateTime?
  createdAt           DateTime  @default(now())
  lastLoginAt         DateTime?
  
  invoices            Invoice[]
  payments            Payment[]
}
```

## Next Steps

1. Implement client registration UI components
2. Create password reset flow
3. Add email verification
4. Implement client portal pages
5. Add payment processing integration