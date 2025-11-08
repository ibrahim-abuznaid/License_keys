// Centralized configuration derived from environment variables with sensible fallbacks.
export const PROJECT_NAME =
  process.env.NEXT_PUBLIC_PROJECT_NAME ?? 'Activepieces License Key Manager';

export const LICENSE_KEYS_TABLE =
  process.env.SUPABASE_TABLE_LICENSE_KEYS ?? 'license_keys';

export const KEY_HISTORY_TABLE =
  process.env.SUPABASE_TABLE_KEY_HISTORY ?? 'key_history';

