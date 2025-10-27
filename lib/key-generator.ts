import { customAlphabet } from 'nanoid';

// Generate a license key in format: AP-XXXX-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
  const parts = [
    'AP',
    nanoid(),
    nanoid(),
    nanoid(),
    nanoid(),
  ];
  return parts.join('-');
}

