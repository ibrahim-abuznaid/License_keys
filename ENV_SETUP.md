# Environment Variables Setup

Add these environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Tables (optional - defaults provided)
SUPABASE_TABLE_LICENSE_KEYS=license_keys
SUPABASE_TABLE_KEY_HISTORY=key_history

# Project Name (optional)
NEXT_PUBLIC_PROJECT_NAME=Activepieces License Key Manager

# Admin Authentication Credentials (REQUIRED)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Cookie Security (Optional)
# Set to true only when you have HTTPS configured
# Leave commented out or set to false for HTTP deployments
USE_SECURE_COOKIES=false
```

## Important Notes

- **ADMIN_USERNAME** and **ADMIN_PASSWORD** are required for the authentication system to work
- Change the default password to a secure one
- The auth session persists for 30 days in the browser cookie
- **USE_SECURE_COOKIES** should be `true` only when using HTTPS (recommended for production)
- For HTTP deployments (during initial setup), leave `USE_SECURE_COOKIES` as `false` or commented out

