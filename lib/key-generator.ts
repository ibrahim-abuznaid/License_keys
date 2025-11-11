import { customAlphabet } from 'nanoid';

// Generate a license key in format: sk_xxxxxxxxxxxxxxxxxxxxx (21 chars)
export function generateLicenseKey(): string {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 21);
  return `sk_${nanoid()}`;
}

