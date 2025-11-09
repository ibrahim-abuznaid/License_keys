# ✅ Active Keys Count Bug - Fixed

## 🐛 Problem

When you disabled a key, it showed as "disabled" in the key details, but when you navigated back to the subscribers dashboard, the "Active Keys" count still showed the key as active (e.g., "1 Active" instead of "0").

## 🔍 Root Cause

The issue was caused by **timezone inconsistencies** in date comparisons:

1. **Disable Route** (`app/api/keys/[id]/disable/route.ts`):
   - Was creating dates in **local timezone**: `today.setHours(0, 0, 0, 0)`
   - When converted to ISO string, timezone offsets could cause the stored date to not match expectations

2. **getKeyStatus Function** (`lib/types.ts`):
   - Was also creating dates in **local timezone** for comparison
   - The exact equality check `expireDate.getTime() === today.getTime()` could fail due to timezone mismatches

**Example of the bug:**
- Server in EST (UTC-5), disabling a key on Nov 9
- Disable sets: `expiresAt = Nov 9, 00:00 EST → Nov 9, 05:00 UTC`
- Status check compares: `Nov 9, 00:00 local` vs `Nov 9, 00:00 local`
- But after parsing from ISO, the dates might not match exactly

## 🔧 The Fix

### 1. Updated Disable Route to Use UTC
**File:** `app/api/keys/[id]/disable/route.ts`

```typescript
// Before:
const today = new Date();
today.setHours(0, 0, 0, 0); // Local timezone

// After:
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
```

### 2. Updated getKeyStatus to Use UTC
**File:** `lib/types.ts`

```typescript
// Now uses UTC dates for consistent comparison
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
const expireDate = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth(), expiresAt.getUTCDate(), 0, 0, 0, 0));

const daysDiff = Math.floor((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

if (daysDiff < 0) {
  if (daysDiff >= -1) {
    return 'disabled'; // Expired today or yesterday (manually disabled)
  }
  return 'expired';
} else if (daysDiff === 0) {
  return 'disabled'; // Expires today
}
return 'active';
```

## ✅ What's Fixed Now

✅ **Consistent UTC dates** - All date operations use UTC to avoid timezone issues  
✅ **More lenient disabled check** - Keys that expired today or yesterday are marked as "disabled"  
✅ **Proper active key counting** - The subscribers dashboard now correctly shows 0 active keys when you disable a key  
✅ **Status badge updates** - The disabled key will show with a red "DISABLED" badge  
✅ **Reactivate button appears** - Disabled keys show the "Reactivate Key" button  

## 🧪 How to Test

1. **Generate a new key** for a test user
2. **Disable the key** from the user detail page
3. **Navigate back** to the subscribers dashboard
4. **Check the "Active Keys" column** - it should now show "0" instead of "1 Active"
5. **Go back to the user detail page** - the key should show as "DISABLED" with a Reactivate button

## 📊 Key Status Logic

| Days Until Expiry | Status | Badge Color | Action Button |
|---|---|---|---|
| `> 0` (future) | active | 🟢 Green | Disable Key |
| `0` (today) | disabled | 🔴 Red | Reactivate Key |
| `-1` (yesterday) | disabled | 🔴 Red | Reactivate Key |
| `< -1` (2+ days ago) | expired | 🟡 Yellow | None |
| `null` (no expiry) | active | 🟢 Green | Disable Key |

## 🚀 Deployment

No database changes required - the fix is in the application logic only. Simply deploy the updated code and the issue will be resolved.

