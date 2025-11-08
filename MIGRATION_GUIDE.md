# Migration Guide - Moving to New Supabase Account

## What You've Done Already ✅
- [x] Created new Supabase account
- [x] `license_keys` table exists in new database with correct schema
- [x] Updated `.env` file with new database URL and secrets

## What You Need to Do Now

### Step 1: Run the Migration SQL Script

1. **Open your new Supabase account dashboard**
   - Go to https://supabase.com and log into your new account

2. **Navigate to SQL Editor**
   - In the left sidebar, click on "SQL Editor"

3. **Run the migration script**
   - Open the file `MIGRATION_TO_NEW_ACCOUNT.sql` (I just created it for you)
   - Copy ALL the contents of this file
   - Paste it into the SQL Editor in Supabase
   - Click "Run" button

4. **Verify success**
   - You should see success messages
   - The script will create:
     - ✅ `key_history` table
     - ✅ All necessary indexes
     - ✅ Row Level Security policies
     - ✅ Foreign key relationships

### Step 2: Verify Your .env File

Make sure your `.env` or `.env.local` file has these variables set:

```env
# Supabase Configuration (NEW ACCOUNT)
NEXT_PUBLIC_SUPABASE_URL=your-new-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# Email Configuration (if using email features)
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-sender-email
SENDER_NAME=your-sender-name

# Optional: Table names (default values work fine)
SUPABASE_TABLE_LICENSE_KEYS=license_keys
SUPABASE_TABLE_KEY_HISTORY=key_history
```

### Step 3: Verify Database Connection

Run your application locally to test:

```bash
npm run dev
```

Visit http://localhost:3000 and check:
- Can you see the existing license keys from the new database?
- Can you perform operations (create, edit, extend keys)?

### Step 4: Check Table Structure in Supabase

1. In Supabase dashboard, go to "Table Editor"
2. You should now see **2 tables**:
   - `license_keys` (already existed)
   - `key_history` (just created)

### Step 5: Test Key Operations

Test these operations to ensure everything works:

1. **View Keys**: Go to homepage, verify existing keys display
2. **Generate New Key**: Create a test key
3. **Edit Key**: Modify a key's properties
4. **Extend Key**: Extend expiration date
5. **Check History**: Verify `key_history` table records actions

---

## Troubleshooting

### Issue: "relation 'key_history' does not exist"
- **Solution**: Run the `MIGRATION_TO_NEW_ACCOUNT.sql` script in Supabase SQL Editor

### Issue: "type 'LicenseKeyType' does not exist"
- **Solution**: The migration script creates this enum. Make sure you ran the entire script.

### Issue: Can't connect to database
- **Solution**: Double-check your `.env` file has the correct:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Permission denied errors
- **Solution**: Make sure you're using the Service Role Key (not the anon key) in `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Foreign key constraint errors
- **Solution**: Ensure the `license_keys` table has `key` as the primary key

---

## What Data Will Be Preserved?

✅ **Preserved** (already in new database):
- All existing license keys
- All key properties (email, features, expiration dates, etc.)

🆕 **New/Empty**:
- `key_history` table (will start recording from now on)

---

## Summary

Your migration is very simple because your new database already has the main `license_keys` table with the correct schema. You only need to:

1. Run `MIGRATION_TO_NEW_ACCOUNT.sql` in Supabase SQL Editor
2. Verify your `.env` file is correct
3. Test the application

**That's it!** Your application will now work with the new database account.

