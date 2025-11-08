import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'auth_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Validates credentials against environment variables
 */
export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('ADMIN')));
    return false;
  }

  console.log('Validating credentials:', {
    usernameProvided: !!username,
    passwordProvided: !!password,
    usernameLength: username.length,
    passwordLength: password.length,
    envUsernameSet: !!validUsername,
    envPasswordSet: !!validPassword,
  });

  const isValid = username === validUsername && password === validPassword;
  console.log('Credentials valid:', isValid);
  
  return isValid;
}

/**
 * Sets authentication cookie
 */
export async function setAuthCookie() {
  const cookieStore = await cookies();
  
  // Only use secure cookies if explicitly enabled via environment variable
  // Set USE_SECURE_COOKIES=true when you have HTTPS configured
  // Defaults to false to work on HTTP during initial deployment
  const useSecureCookies = process.env.USE_SECURE_COOKIES === 'true';
  
  console.log('Setting auth cookie:', {
    secure: useSecureCookies,
    nodeEnv: process.env.NODE_ENV,
    useSecureCookiesEnv: process.env.USE_SECURE_COOKIES
  });
  
  cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clears authentication cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Checks if user is authenticated by checking cookie
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === 'authenticated';
}

/**
 * Middleware helper to check authentication
 */
export function checkAuthMiddleware(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  return authCookie?.value === 'authenticated';
}

