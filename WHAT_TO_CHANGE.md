# What to Change vs Keep As-Is

## ✅ MUST DO - Required Changes

### 1. Create `key_history` Table
**File:** Use `SAFE_MIGRATION.sql` (I just created this)

**Why:** Your application code expects this table to exist. Without it, operations like edit, extend, disable will fail.

**Safe:** Yes! This creates a NEW table and doesn't touch your existing `license_keys` table.

**How:**
1. Open Supabase SQL Editor in your new account
2. Copy contents from `SAFE_MIGRATION.sql`
3. Run it

---

## ❌ DO NOT CHANGE - Keep As-Is

### 1. `license_keys` Table Structure
**Keep it exactly as it is!** Your production apps are using it.

### 2. Existing RLS Policies on `license_keys`
**Don't modify them!** If apps are working, policies are correct.

### 3. Existing Indexes on `license_keys`
**Leave them alone!** They're already optimized for your production use.

### 4. Any Data in `license_keys`
**Don't touch the data!** All existing keys should remain unchanged.

---

## 🔍 VERIFY - Check Your Setup

### Check 1: Does `key_history` table exist?
```sql
SELECT * FROM key_history LIMIT 1;
```

- ✅ If you get "empty result" → Good! Table exists, just no data yet
- ❌ If you get "relation does not exist" → Run `SAFE_MIGRATION.sql`

### Check 2: Can your app connect?
- Update your `.env` file with new credentials
- Run `npm run dev`
- Visit homepage - do you see existing keys?

### Check 3: Test one operation
Try editing a key or extending expiration:
- If it works → Migration successful!
- If you get database errors → Check error message (I can help debug)

---

## 🎯 Why This Is Safe

The `SAFE_MIGRATION.sql` script:
- ✅ Only creates NEW table (`key_history`)
- ✅ Doesn't modify `license_keys` table
- ✅ Doesn't change any existing data
- ✅ Doesn't alter existing policies
- ✅ Uses `IF NOT EXISTS` to avoid errors if table already exists

**Note:** I removed the foreign key constraint from `key_history` that references `license_keys` to avoid any potential issues. The app will work fine without it - it's just a safeguard, not required for functionality.

---

## 📋 Summary

### Required:
1. ✅ Run `SAFE_MIGRATION.sql` to create `key_history` table
2. ✅ Update `.env` with new database credentials

### Keep As-Is:
1. ❌ Don't touch `license_keys` table
2. ❌ Don't modify existing RLS policies
3. ❌ Don't change existing data

**That's it!** Your existing production setup stays exactly the same, you just add one new table.

