# Authentication System Setup

This document explains the authentication system that has been added to your application.

## Overview

A simple and secure authentication system has been implemented with the following features:
- Login page with username and password
- Single admin account (credentials stored in environment variables)
- Persistent session (stays logged in even after closing the browser)
- Protected routes (redirects to login if not authenticated)
- Logout functionality

## Files Created/Modified

### New Files Created

1. **`lib/auth.ts`** - Authentication utility functions
   - `validateCredentials()` - Validates username/password against env variables
   - `setAuthCookie()` - Creates persistent auth cookie (30 days)
   - `clearAuthCookie()` - Removes auth cookie on logout
   - `isAuthenticated()` - Checks if user is authenticated
   - `checkAuthMiddleware()` - Middleware helper for route protection

2. **`app/api/auth/login/route.ts`** - Login API endpoint
   - POST endpoint that validates credentials and sets auth cookie

3. **`app/api/auth/logout/route.ts`** - Logout API endpoint
   - POST endpoint that clears auth cookie

4. **`app/api/auth/check/route.ts`** - Auth check API endpoint
   - GET endpoint to check authentication status

5. **`app/login/page.tsx`** - Login page component
   - Beautiful login form with error handling
   - Loading states
   - Responsive design

6. **`middleware.ts`** - Route protection middleware
   - Automatically redirects unauthenticated users to login page
   - Allows access to login page and auth API routes
   - Protects all other routes

7. **`components/LogoutButton.tsx`** - Logout button component
   - Logout button with loading state
   - Redirects to login page after logout

8. **`ENV_SETUP.md`** - Environment variables documentation

### Modified Files

1. **`app/layout.tsx`** - Updated to:
   - Check authentication status
   - Show/hide navigation based on auth state
   - Include logout button in navigation

## Setup Instructions

### 1. Add Environment Variables

Add these two required variables to your `.env.local` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

**Important:** Replace `your_secure_password_here` with a strong, secure password.

### 2. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## How It Works

### Login Flow

1. User visits any page
2. Middleware checks if user is authenticated (via cookie)
3. If not authenticated, user is redirected to `/login`
4. User enters username and password
5. Credentials are validated against environment variables
6. If valid, an HTTP-only cookie is set with 30-day expiration
7. User is redirected to the home page

### Session Persistence

- Authentication is stored in an HTTP-only cookie
- Cookie has a 30-day expiration (configurable in `lib/auth.ts`)
- Cookie persists even after closing the browser
- Cookie is secure in production (HTTPS only)

### Logout Flow

1. User clicks "Logout" button in navigation
2. API call to `/api/auth/logout` clears the auth cookie
3. User is redirected to login page
4. All subsequent requests will require re-authentication

### Route Protection

- **Protected routes:** All pages except `/login` and `/api/auth/*`
- **Middleware:** Automatically handles redirects (see `middleware.ts`)
- **No code changes needed:** Protection is automatic for all routes

## Security Features

✅ **HTTP-only cookies** - JavaScript cannot access the auth cookie  
✅ **Secure flag in production** - Cookie only sent over HTTPS  
✅ **SameSite protection** - Prevents CSRF attacks  
✅ **Environment-based credentials** - No hardcoded passwords  
✅ **Server-side validation** - All auth checks happen on the server  
✅ **Automatic route protection** - Middleware protects all routes  

## Customization

### Change Session Duration

Edit the `COOKIE_MAX_AGE` constant in `lib/auth.ts`:

```typescript
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (in seconds)
```

### Change Protected Routes

Edit the middleware logic in `middleware.ts` to allow/deny specific routes.

### Multiple Admin Accounts

To support multiple admin accounts, you would need to:
1. Move from environment variables to a database
2. Add password hashing (bcrypt)
3. Update the `validateCredentials()` function

## Testing

1. **Test Login:**
   - Navigate to `http://localhost:3000`
   - Should redirect to `/login`
   - Enter correct credentials
   - Should redirect to home page

2. **Test Session Persistence:**
   - Log in successfully
   - Close browser completely
   - Reopen browser and navigate to `http://localhost:3000`
   - Should still be logged in (no redirect to login)

3. **Test Logout:**
   - Click "Logout" button in navigation
   - Should redirect to login page
   - Try to navigate to home page
   - Should redirect back to login

4. **Test Invalid Credentials:**
   - Try to log in with wrong username/password
   - Should show error message
   - Should not be authenticated

## Troubleshooting

### "Invalid credentials" error with correct password

- Make sure you've added `ADMIN_USERNAME` and `ADMIN_PASSWORD` to `.env.local`
- Restart your development server after adding env variables
- Check for extra spaces in your `.env.local` file

### Infinite redirect loop

- Clear your browser cookies
- Restart the development server
- Check that middleware.ts is properly configured

### Not staying logged in

- Check that cookies are enabled in your browser
- Check browser console for cookie-related errors
- Verify the cookie is being set (check browser DevTools > Application > Cookies)

## Production Deployment

Before deploying to production:

1. ✅ Set strong `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your production environment variables
2. ✅ Ensure your production environment uses HTTPS (required for secure cookies)
3. ✅ Update environment variables in your hosting platform (Vercel, DigitalOcean, etc.)
4. ✅ Test login/logout flow in production

## Next Steps (Optional Enhancements)

If you want to enhance the authentication system in the future:

- Add "Remember Me" checkbox for different session durations
- Add password reset functionality (requires email service)
- Add multiple user support with database
- Add password hashing for better security
- Add rate limiting to prevent brute force attacks
- Add 2FA (two-factor authentication)
- Add session activity logging

