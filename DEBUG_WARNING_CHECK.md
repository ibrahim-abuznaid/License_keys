# 🔍 Debugging: Why Warning Isn't Showing

## Quick Test Steps

### 1. Open Browser Console
1. Open http://localhost:3000/generate-key
2. Press **F12** to open Developer Tools
3. Go to **Console** tab

### 2. Type an Email
1. In the "Customer Email" field, type an email that has existing keys
2. Wait 500ms after you stop typing
3. Look at the console - you should see:

```
🔍 Checking for existing keys for: test@example.com
📊 Response status: 200
✅ Found keys: 2 [Array of keys]
```

### 3. Check What You See

#### If Console Shows "Found keys: 0" or "No keys found"
- The email doesn't have any keys in the database yet
- Try typing a different email that you know has keys

#### If Console Shows "Found keys: X" but NO WARNING appears
- There might be a rendering issue
- Check browser console for any React errors
- Try refreshing the page

#### If Console Shows Nothing
- The fetch might not be triggering
- Check that you typed a complete email with @ symbol
- Wait at least 500ms after typing

---

## Test with Known Email

### Option 1: Create a Test Key First
1. Generate a key for `test@activepieces.com`
2. Go back to `/generate-key`
3. Type `test@activepieces.com` again
4. **You should see the warning!**

### Option 2: Use Existing User
1. Go to homepage (http://localhost:3000)
2. Look at the subscribers list
3. Pick any email from the list
4. Go to `/generate-key`
5. Type that email
6. **You should see the warning!**

---

## Expected Warning Appearance

When it works, you'll see a **prominent yellow warning box** below the email field:

```
⚠️ Warning: This user already has 2 license keys!

• production key (active) - Activated: Nov 08, 2024
• trial key (expired) - Activated: Oct 15, 2024

[View all keys for this user →]

⚠️ Be careful! You can still proceed to generate a new key, but make sure this is intentional.
```

---

## Common Issues

### Issue 1: Email Doesn't Have Keys Yet
**Symptom:** Console shows "Found keys: 0"  
**Solution:** Create a key for that email first, then try again

### Issue 2: Debounce Delay
**Symptom:** Warning doesn't appear immediately  
**Solution:** Wait 500ms after you stop typing

### Issue 3: Invalid Email Format
**Symptom:** Console shows nothing  
**Solution:** Make sure email contains @ symbol

### Issue 4: API Not Running
**Symptom:** Console shows network error  
**Solution:** Make sure `npm run dev` is running

---

## What to Send Me

If it's still not working, please send me:

1. **Console output** - Copy all the logs from console
2. **Screenshot** - Show the form with email typed
3. **Email used** - What email did you type?
4. **Does that email have keys?** - Check homepage to confirm

This will help me identify the exact issue! 🔍

