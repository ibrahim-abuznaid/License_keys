import { customAlphabet } from 'nanoid';

// Generate a license key in format: SK-XXXX-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
  const parts = [
    'SK',
    nanoid(),
    nanoid(),
    nanoid(),
    nanoid(),
  ];
  return parts.join('-');
}

