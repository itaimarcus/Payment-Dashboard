# How to Enable "Skip Consent" in Auth0

## Why You Need This

Your dashboard currently logs you out on every refresh because Auth0 requires user consent each time. This is the fix.

## Step-by-Step Instructions

### Step 1: Open Auth0 Dashboard

1. Go to: **https://manage.auth0.com**
2. Login with your credentials

### Step 2: Navigate to APIs

1. Click **Applications** in the left sidebar
2. Click **APIs**
3. Find and click on **"Payment Dashboard API"**
   - Look for the one with Identifier: `https://payment-dashboard-api`

### Step 3: Enable Skip Consent

1. Click the **Settings** tab
2. Scroll down to find: **"Allow Skipping User Consent"**
3. Toggle the switch to **ON** (enabled)
4. Scroll to the bottom
5. Click **"Save"** button

**Screenshot Guide:**
```
[Settings Tab]
...
Allow Skipping User Consent
[Toggle Switch: OFF] → Click to turn ON
...
[Save Button] ← Click this
```

### Step 4: Test the Fix

1. **Logout** from the Payment Dashboard
2. **Clear browser cache**:
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"
3. **Close all browser tabs** of the app
4. **Open the app** again: http://localhost:5173
5. **Login** (you may see consent screen one last time - click Accept)
6. **Refresh the page** (F5)
7. **You should stay logged in!** ✅

## What This Setting Does

- **Before**: Auth0 asks for consent every time you request a token
- **After**: Auth0 trusts your application and skips consent for your users
- **Result**: Silent token renewal works, page refreshes don't log you out

## This is Standard for First-Party Apps

This setting is **normal and recommended** for SPAs (Single Page Applications) that access their own backend APIs. Consent is only needed for third-party applications.

## Verification

After enabling the setting and testing:

**Browser Console should show:**
```
🔐 Attempting to get Auth0 access token...
✅ Token retrieved successfully
✅ Token set in API client
📡 API: Fetching payments...
✅ API: Payments fetched successfully
```

**No more logout on refresh!**

## If You Can't Change Auth0 Settings

If you don't have permission to modify Auth0 settings, we've implemented a fallback solution using popup authentication. The app will automatically show a consent popup when needed instead of logging you out.

## Troubleshooting

### Still logging out after enabling?

1. Make sure you clicked **Save** after enabling the toggle
2. Logout and clear browser cache completely
3. Close ALL browser tabs/windows
4. Login fresh - should work now

### Don't see "Allow Skipping User Consent" option?

- You might be using an older Auth0 plan
- Or your organization has restricted this setting
- In this case, use the popup handler (already implemented in the app)

### Consent screen keeps appearing?

- Clear browser cache and cookies for localhost
- Try in an incognito/private browser window
- Make sure you're logged into the correct Auth0 account

## Security Note

Enabling "Skip Consent" is secure when:
- ✅ The API is your own backend (not a third-party API)
- ✅ The application is your own SPA (not a third-party app)
- ✅ Users trust your application

This is exactly your setup, so it's safe and recommended.

---

**Estimated time:** 2-3 minutes to complete

After this change, your dashboard will work like a normal web app - staying logged in across refreshes!
