# Auth0 API Setup Guide

## Problem

The "Failed to fetch payments" error is most likely caused by a missing Auth0 API configuration. The application requires an API to be registered in Auth0 with the identifier `https://payment-dashboard-api`.

## How to Fix

### Step 1: Login to Auth0 Dashboard

1. Go to: https://manage.auth0.com
2. Login with your Auth0 account credentials

### Step 2: Check if API Exists

1. In the left sidebar, click **Applications** → **APIs**
2. Look for an API with:
   - **Name**: "Payment Dashboard API" (or similar)
   - **Identifier**: `https://payment-dashboard-api`

### If API Exists:

✅ Skip to Step 4 below

### If API Does NOT Exist (Most Likely Case):

Proceed to Step 3 to create it.

### Step 3: Create the API

1. Click the **"+ Create API"** button (top right)

2. Fill in the form:
   ```
   Name: Payment Dashboard API
   Identifier: https://payment-dashboard-api
   Signing Algorithm: RS256
   ```
   
   **IMPORTANT**: The Identifier MUST be exactly `https://payment-dashboard-api` (no trailing slash)

3. Click **"Create"**

4. You'll be taken to the API settings page. You can leave the default settings.

### Step 4: Authorize Your Application to Use the API

1. Go to **Applications** → **Applications** in the left sidebar

2. Find your Single Page Application (the one you created for this project)

3. Click on it to open settings

4. Scroll down to **APIs** section

5. Make sure the **"Payment Dashboard API"** is listed and authorized

6. If not, click **"Authorize"** or add it

7. Click **"Save Changes"** at the bottom

### Step 5: Verify Configuration Matches

Double-check your environment variables match:

**Client (.env in client folder):**
```env
VITE_AUTH0_AUDIENCE=https://payment-dashboard-api
```

**Server (.env in server folder):**
```env
AUTH0_AUDIENCE=https://payment-dashboard-api
```

Both must match the API Identifier you created in Auth0.

## After Creating the API

### Test the Fix:

1. **Refresh the browser** (or clear cache: Ctrl+Shift+R)
2. **Logout** from the application
3. **Login again** (this gets a fresh token)
4. **Try loading the dashboard**

The payments should now load successfully!

## Debugging Output

With the debugging code now added, check your browser console (F12) for:

### Expected Output After Fix:

```
🔐 Attempting to get Auth0 access token...
   Audience: https://payment-dashboard-api
✅ Token retrieved successfully
   Token preview: eyJhbGciOiJSUzI1NiIsInR5cCI6...
   Token length: 1234
✅ Token set in API client
📡 API: Fetching payments...
   URL: http://localhost:3001/api/payments
   Auth header: Present (Bearer ...)
   Params: none
✅ API: Payments fetched successfully
   Count: 0
```

### If Still Getting Errors:

Check the backend logs (server terminal) for:
```
📥 GET /api/payments - Request received
   Auth header present: true
   Auth object: Present
   User sub: auth0|1234567890
   Extracted userId: auth0|1234567890
   Status filter: none
   Querying DynamoDB...
✅ Query successful, payments found: 0
```

## Common Issues

### Issue 1: "consent_required" Error

**Error in console:**
```
Failed to get access token: { error: "consent_required" }
```

**Fix:**
- The API needs user consent
- Logout and login again
- On login, you'll see a consent screen - click "Accept"

### Issue 2: "Invalid audience" Error

**Error in backend logs:**
```
JWT verification failed: audience mismatch
```

**Fix:**
- Double-check the API Identifier in Auth0 matches exactly: `https://payment-dashboard-api`
- No trailing slash, no http/https typo
- Restart the backend server after any .env changes

### Issue 3: 401 Unauthorized

**Error in browser network tab:**
```
Status: 401
Response: { "error": "Unauthorized", "message": "Invalid or missing authentication token" }
```

**Fix:**
- Most likely the API doesn't exist in Auth0 yet
- Follow Step 3 above to create it
- Logout and login again

### Issue 4: Token Not Retrieved

**Error in console:**
```
❌ Failed to get access token: login_required
```

**Fix:**
- Logout and login again
- Clear browser cache
- Check Auth0 application settings (callback URLs, etc.)

## Verification Checklist

After completing the setup:

- [ ] API exists in Auth0 with identifier `https://payment-dashboard-api`
- [ ] API signing algorithm is RS256
- [ ] Application is authorized to use the API
- [ ] Client .env has correct VITE_AUTH0_AUDIENCE
- [ ] Server .env has correct AUTH0_AUDIENCE
- [ ] Both .env values match the API identifier exactly
- [ ] Logged out and logged back in to get fresh token
- [ ] Browser cache cleared
- [ ] Backend server restarted (if .env was changed)

## Still Not Working?

If you've completed all steps and it's still not working:

1. **Check browser console** (F12) for the debug messages
2. **Check backend logs** in the server terminal
3. **Share the debug output** - it will show exactly what's failing

The debug messages added will pinpoint the exact issue!
