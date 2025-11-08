# Database Connection Diagnostic

## The Problem
Your app can't see subscribers even though the database has data. This is likely a **field name mismatch**.

## What Your Code Expects

Your application expects the `license_keys` table to have these **exact field names**:

```
✅ REQUIRED FIELDS (camelCase):
- key
- email
- createdAt
- expiresAt
- activatedAt
- keyType
- isTrial
- ssoEnabled
- gitSyncEnabled
- showPoweredBy
- embeddingEnabled
- auditLogEnabled
- customAppearanceEnabled
- manageProjectsEnabled
- managePiecesEnabled
- manageTemplatesEnabled
- apiKeysEnabled
- customDomainsEnabled
- projectRolesEnabled
- flowIssuesEnabled
- alertsEnabled
- premiumPieces
- companyName
- goal
- analyticsEnabled
- globalConnectionsEnabled
- customRolesEnabled
- environmentsEnabled
- notes
- fullName
- numberOfEmployees
- agentsEnabled
- tablesEnabled
- todosEnabled
- mcpsEnabled
- activeFlows
```

---

## How to Diagnose

### Step 1: Check What's Actually in Your Database

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'license_keys'
);

-- Check actual column names in your table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'license_keys'
ORDER BY ordinal_position;

-- Check if you have any data
SELECT COUNT(*) as total_keys FROM license_keys;

-- Try to select a sample row
SELECT * FROM license_keys LIMIT 1;
```

### Step 2: Compare Column Names

**Expected columns (what the app needs):**
- `createdAt` (camelCase)
- `expiresAt` (camelCase)
- `activatedAt` (camelCase)
- `keyType` (camelCase)

**What your database might have:**
- Check the output from Step 1

---

## Common Issues

### Issue 1: RLS (Row Level Security) Blocking Access
Even if data exists, RLS policies might block the query.

**Check:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'license_keys';

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'license_keys';
```

**If RLS is blocking, you need to ensure your policy allows service role access.**

### Issue 2: Wrong Table Name
Your `.env` file might point to a different table name.

**Check your `.env` file:**
```env
SUPABASE_TABLE_LICENSE_KEYS=license_keys
```

If this variable is set to something else, the app will query the wrong table.

### Issue 3: Wrong Supabase Project
Double-check your `.env` has the correct URL for the NEW account:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

---

## Testing Connection

### Quick Test: Check API Response

1. Start your app:
   ```bash
   npm run dev
   ```

2. Open browser and go to:
   ```
   http://localhost:3000/api/subscribers
   ```

3. You should see JSON response. Check:
   - Does it have `data: []` (empty) or `data: [...]` (with items)?
   - Is there an `error` field?

### Check Browser Console

1. Open http://localhost:3000
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for any red errors
5. Go to Network tab → Refresh page → Check the `/api/subscribers` request

---

## What to Send Me

Run the SQL queries from **Step 1** and send me:

1. **Column names from your database** (from the 2nd query)
2. **Total count of keys** (from the 3rd query)  
3. **Any errors from the browser console**
4. **The JSON response from `/api/subscribers`**

Then I can tell you exactly what needs to be fixed!

---

## Quick Fix If It's RLS

If the issue is RLS blocking access, run this:

```sql
-- Enable all access for service role
DROP POLICY IF EXISTS "Enable all access for service role" ON license_keys;
CREATE POLICY "Enable all access for service role" ON license_keys
    FOR ALL USING (true);
```

**Note:** This should already be there, but sometimes policies get misconfigured.

