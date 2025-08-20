# Authentication Components

This directory contains the client authentication components for the invoice application's client portal. These components provide a complete authentication flow including login, registration, and password reset functionality.

## Components

### LoginForm

A comprehensive login form component with email/password authentication.

**Features:**
- Email and password validation
- Show/hide password toggle
- Loading states and error handling
- NextAuth.js integration
- Rate limiting protection
- Responsive design

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
  className?: string
}
```

**Usage:**
```tsx
import { LoginForm } from "@/components/auth"

<LoginForm
  onSuccess={() => console.log("Login successful")}
  redirectTo="/client/dashboard"
  className="max-w-md mx-auto"
/>
```

### RegisterForm

A user registration form with comprehensive validation and email verification.

**Features:**
- Real-time password strength validation
- Password confirmation matching
- Email format validation
- Optional company field
- Loading states and error handling
- Success feedback with email verification notice

**Props:**
```typescript
interface RegisterFormProps {
  onSuccess?: () => void
  className?: string
}
```

**Usage:**
```tsx
import { RegisterForm } from "@/components/auth"

<RegisterForm
  onSuccess={() => router.push("/auth/verify-email")}
  className="max-w-md mx-auto"
/>
```

### PasswordResetForm

A dual-mode component for password reset requests and password reset completion.

**Features:**
- Email request mode (no token)
- Password reset mode (with token)
- Password strength validation
- Secure token handling
- Success/error feedback
- Automatic redirection after successful reset

**Props:**
```typescript
interface PasswordResetFormProps {
  token?: string
  onSuccess?: () => void
  className?: string
}
```

**Usage:**
```tsx
import { PasswordResetForm } from "@/components/auth"

// Request reset mode
<PasswordResetForm className="max-w-md mx-auto" />

// Reset password mode
<PasswordResetForm
  token="reset-token-from-email"
  onSuccess={() => router.push("/auth/signin")}
  className="max-w-md mx-auto"
/>
```

## API Endpoints

The components integrate with the following API endpoints:

### POST /api/auth/register
Registers a new client user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp", // optional
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "clientId": "user-id"
}
```

### POST /api/auth/forgot-password
Initiates password reset process.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Completes password reset with token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting
- Registration: 5 attempts per 15 minutes per IP
- Forgot password: 3 attempts per 15 minutes per IP
- Reset password: 5 attempts per 15 minutes per IP

### Security Measures
- Password hashing with bcrypt (12 rounds)
- Secure JWT tokens for reset/verification
- Email enumeration protection
- Input validation and sanitization
- CSRF protection
- Secure cookie settings

## Authentication Flow

### Registration Flow
1. User fills out registration form
2. Client-side validation (email format, password strength)
3. API call to `/api/auth/register`
4. Server validation and user creation
5. Email verification token generated
6. Success message displayed
7. Email sent with verification link (TODO)

### Login Flow
1. User enters email and password
2. Client-side validation
3. NextAuth.js signIn call
4. Server validates credentials
5. Session created on success
6. Redirect to client portal

### Password Reset Flow
1. User requests password reset
2. API call to `/api/auth/forgot-password`
3. Reset token generated and stored
4. Email sent with reset link (TODO)
5. User clicks link with token
6. Password reset form with token
7. API call to `/api/auth/reset-password`
8. Password updated and token cleared

## Middleware Protection

The authentication system includes middleware protection for client routes:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Protect /client/* routes
  // Redirect unauthenticated users to login
  // Check email verification status
}
```

## Testing

### Component Testing
```bash
# Visit the test page
http://localhost:3000/test-auth

# Run component tests
npm run test -- components/auth --run
```

### API Testing
```bash
# Test authentication utilities
npx tsx scripts/test-auth-components.ts

# Test API endpoints (requires server running)
npx tsx scripts/test-auth-api.ts
```

## Integration with NextAuth.js

The components integrate seamlessly with NextAuth.js:

```typescript
// lib/auth/config.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Custom credentials validation
    })
  ],
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/register",
    error: "/auth/error",
  },
  // Session and JWT configuration
}
```

## Styling

Components use Tailwind CSS and shadcn/ui components:
- Consistent design system
- Responsive layouts
- Accessible form controls
- Loading states and animations
- Error and success states

## Future Enhancements

- [ ] Email verification implementation
- [ ] Social login providers (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Account lockout after failed attempts
- [ ] Password history prevention
- [ ] Session management improvements
- [ ] Audit logging

## Dependencies

- `next-auth`: Authentication framework
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token handling
- `lucide-react`: Icons
- `@radix-ui/*`: UI primitives
- `tailwindcss`: Styling
- `class-variance-authority`: Component variants

## Environment Variables

Required environment variables:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

## Error Handling

Components include comprehensive error handling:
- Network errors
- Validation errors
- Authentication failures
- Rate limiting
- Server errors
- Token expiration

All errors are displayed to users with appropriate messaging and retry options.