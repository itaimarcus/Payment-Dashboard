# Auth0 Session Configuration Guide

## Current Session Settings

Your Payment Dashboard is configured with the following session durations:

- **Maximum Session Lifetime:** 2 days (48 hours)
- **Idle Timeout:** 4 hours of inactivity
- **Access Token Lifetime:** 4 hours

This means:
- Users stay logged in for up to 2 days if they remain active
- Users must re-login after 4 hours of inactivity
- More secure than the default 30-day session

## How Sessions Work

### Automatic Login Flow

```
User logs in
    ↓
Refresh token stored in browser (valid for 2 days)
    ↓
Access token retrieved (valid for 4 hours)
    ↓
User visits again (within 4 hours) → Auto-logged in
    ↓
User inactive for 4+ hours → Must re-login
    ↓
After 2 days total → Must re-login (regardless of activity)
```

### Token Types

**Access Token:**
- Used for API calls to backend
- Lifetime: 4 hours
- Automatically refreshed if user is active

**Refresh Token:**
- Used to get new access tokens
- Absolute lifetime: 2 days
- Inactivity timeout: 4 hours

## Configuring Session Duration in Auth0 Dashboard

### Prerequisites

1. Access to [Auth0 Dashboard](https://manage.auth0.com)
2. Admin permissions for your tenant
3. Your application name: `Payment Dashboard`

### Step 1: Configure Refresh Token Settings

1. **Navigate to Application Settings:**
   - Go to: https://manage.auth0.com
   - Click: **Applications** → **Applications**
   - Find and click: **Payment Dashboard**
   - Click: **Settings** tab

2. **Scroll to Refresh Token Rotation:**
   - Find section: **Refresh Token Rotation**
   - If not visible, click **Show Advanced Settings** → **Grant Types**
   - Ensure **Refresh Token** is checked

3. **Set Token Expiration Values:**
   ```
   Refresh Token Expiration: 172800 seconds (2 days)
   Refresh Token Expiration Type: Rotating
   Inactivity Expiration: 14400 seconds (4 hours)
   Absolute Expiration: 172800 seconds (2 days)
   ```

4. **Click:** Save Changes (bottom of page)

### Step 2: Configure Access Token Settings

1. **Navigate to API Settings:**
   - Go to: **Applications** → **APIs**
   - Find and click: **Payment Dashboard API**
   - Click: **Settings** tab

2. **Set Token Expiration:**
   ```
   Token Expiration (Seconds): 14400 (4 hours)
   Token Expiration For Browser Flows (Seconds): 14400 (4 hours)
   ```

3. **Ensure Required Settings:**
   - **Allow Offline Access:** ✅ Enabled (required for refresh tokens)
   - **Allow Skipping User Consent:** ✅ Enabled (recommended for better UX)

4. **Click:** Save (top right)

### Step 3: Verify Configuration

After saving, verify the settings:

```bash
# In Auth0 Dashboard, go to:
# Applications → Payment Dashboard → Settings → Advanced Settings → OAuth

# Check these values:
Refresh Token Rotation: Enabled
Refresh Token Expiration: 172800 seconds
Inactivity Expiration: 14400 seconds
Absolute Expiration: 172800 seconds

# In APIs → Payment Dashboard API → Settings:
Token Expiration: 14400 seconds
```

## Understanding the Values

### Time Conversions

```
Seconds → Hours → Days
3600    = 1 hour
14400   = 4 hours
43200   = 12 hours
86400   = 24 hours = 1 day
172800  = 48 hours = 2 days
259200  = 72 hours = 3 days
604800  = 168 hours = 7 days
2592000 = 720 hours = 30 days (Auth0 default)
```

### Current Configuration

| Setting | Seconds | Human Time |
|---------|---------|------------|
| Access Token Lifetime | 14400 | 4 hours |
| Idle Timeout | 14400 | 4 hours |
| Maximum Session | 172800 | 2 days |
| Absolute Expiration | 172800 | 2 days |

## Testing Session Configuration

### Test 1: Normal Usage (Should Work)

**Scenario:** User is active within 4 hours

1. Login to dashboard
2. View payments
3. Wait 2 hours
4. Refresh page (F5)
5. **Expected:** Still logged in, no login required

**Why:** Session is still active (< 4 hours idle)

---

### Test 2: Idle Timeout (Should Require Re-login)

**Scenario:** User is inactive for 4+ hours

1. Login to dashboard
2. Leave browser open but don't interact
3. Wait 4 hours and 5 minutes
4. Refresh page (F5)
5. **Expected:** Redirected to login page
6. **Console Message:** "Session has expired. Please log in again."

**Why:** Exceeded 4-hour inactivity timeout

**Quick Test (Development Only):**
- Temporarily set Inactivity Expiration to `300` seconds (5 minutes)
- Wait 5 minutes
- Refresh → Should require login
- **Remember to change back to 14400!**

---

### Test 3: Absolute Timeout (Should Require Re-login)

**Scenario:** User is active but 2 days have passed

1. Login to dashboard
2. Visit every 3 hours (stay active, avoid idle timeout)
3. After 48 hours (2 days), refresh page
4. **Expected:** Redirected to login page

**Why:** Exceeded 2-day absolute maximum

**Quick Test (Development Only):**
- Temporarily set Absolute Expiration to `3600` seconds (1 hour)
- Stay active (refresh every 10 minutes)
- After 1 hour, should require login
- **Remember to change back to 172800!**

---

### Test 4: Token Refresh (Should Work Automatically)

**Scenario:** Access token expires but refresh token is valid

1. Login to dashboard
2. Wait 4 hours (access token expires)
3. Make an API call (create payment, view stats)
4. **Expected:** Works seamlessly (token auto-refreshed)

**Why:** Refresh token gets new access token automatically

---

## Console Output for Session Events

### Successful Login
```
⏳ Auth0 is loading, waiting...
🔐 Attempting to get Auth0 access token...
✅ Token retrieved successfully
✅ Token set in API client - Ready to fetch data!
```

### Session Expired (Idle Timeout)
```
❌ Failed to get access token
   Error code: login_required
⏱️  Session has expired - login required
💡 Session expired due to inactivity or absolute timeout
   Configure session duration in Auth0 Dashboard - see AUTH0_SESSION_CONFIG.md
```

### Token Auto-Refresh (Seamless)
```
🔐 Attempting to get Auth0 access token...
✅ Token retrieved successfully (cached/refreshed)
```

## Adjusting Session Duration

### Making Sessions Longer

**For longer sessions (e.g., 7 days):**

1. Go to Auth0 Dashboard
2. Update values:
   ```
   Refresh Token Expiration: 604800 seconds (7 days)
   Inactivity Expiration: 86400 seconds (1 day)
   Absolute Expiration: 604800 seconds (7 days)
   ```
3. Save changes

**Trade-off:** Less secure, more convenient

---

### Making Sessions Shorter

**For shorter sessions (e.g., 1 day):**

1. Go to Auth0 Dashboard
2. Update values:
   ```
   Refresh Token Expiration: 86400 seconds (1 day)
   Inactivity Expiration: 3600 seconds (1 hour)
   Absolute Expiration: 86400 seconds (1 day)
   ```
3. Save changes

**Trade-off:** More secure, less convenient

---

## Security Best Practices

### Current Configuration (2 days / 4 hours) is good for:

✅ Payment processing applications
✅ Financial dashboards
✅ Business tools with sensitive data
✅ Shared computer environments
✅ Compliance requirements (PCI-DSS, SOC2)

### Consider Shorter Sessions (1 day / 1 hour) for:

- Banking applications
- Admin panels with privileged access
- Healthcare data (HIPAA compliance)
- Government systems

### Consider Longer Sessions (7 days / 1 day) for:

- Consumer apps with low security risk
- Internal tools for trusted users
- Development environments

## Comparison: Session Durations

| Scenario | Idle Timeout | Max Session | Use Case |
|----------|--------------|-------------|----------|
| High Security | 1 hour | 1 day | Banking, Admin |
| **Current (Balanced)** | **4 hours** | **2 days** | **Payments, Financial** |
| Moderate | 1 day | 7 days | Business Tools |
| Low Security | 3 days | 30 days | Consumer Apps |

## Troubleshooting

### Issue: Users logged out too frequently

**Possible Causes:**
1. Idle timeout too short
2. Users expecting longer sessions
3. Refresh token not configured

**Solutions:**
- Increase Inactivity Expiration to 1 day (86400 seconds)
- Verify "Allow Offline Access" is enabled in Auth0 API
- Check `useRefreshTokens={true}` in `client/src/main.tsx`

---

### Issue: Session never expires

**Possible Causes:**
1. Refresh Token Rotation not enabled
2. Settings not saved in Auth0
3. Browser caching old tokens

**Solutions:**
- Verify settings in Auth0 Dashboard
- Clear browser localStorage: `localStorage.clear()`
- Logout and login again to get new tokens

---

### Issue: "Session expired" immediately after login

**Possible Causes:**
1. System clock mismatch
2. Token expiration set too low
3. Network latency

**Solutions:**
- Ensure system time is correct
- Increase Access Token Expiration to at least 3600 seconds (1 hour)
- Check network tab for Auth0 API errors

---

## Code Reference

The session handling is implemented in:

### Frontend Configuration

**File:** `client/src/main.tsx`
```typescript
<Auth0Provider
  domain={domain}
  clientId={clientId}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: audience,
  }}
  cacheLocation="localstorage"      // Enables persistent sessions
  useRefreshTokens={true}            // Enables automatic token refresh
>
```

### Session Expiration Handling

**File:** `client/src/contexts/AuthTokenContext.tsx`
```typescript
if (error?.error === 'login_required') {
  console.log('⏱️  Session has expired - login required');
  setTokenError('Your session has expired. Please log in again.');
  setTokenReady(false);
  return;
}
```

## FAQ

**Q: How do I see when my session expires?**
A: Check the console for token retrieval messages. The token preview shows expiration info.

**Q: Can users choose their session length?**
A: Not currently. You could implement a "Remember Me" checkbox - see Optional Enhancements in the plan.

**Q: What happens if I change settings while users are logged in?**
A: Existing sessions continue with old settings. New settings apply to new logins only.

**Q: Can I have different session times for different users?**
A: Yes, but requires custom Auth0 Actions or Rules - beyond this guide's scope.

**Q: Is 2 days secure enough?**
A: Yes, for most business applications. It's 15x shorter than the 30-day default and follows industry standards for financial apps.

**Q: How do I completely disable persistent sessions?**
A: Remove `cacheLocation="localstorage"` and `useRefreshTokens={true}` from `main.tsx`. Users will need to login every time they close the browser.

## Related Documentation

- [Auth0 Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [Auth0 Token Lifetime](https://auth0.com/docs/secure/tokens/access-tokens/access-token-lifetime)
- [Auth0 Silent Authentication](https://auth0.com/docs/authenticate/login/configure-silent-authentication)

## Summary

Your current configuration:
- ✅ Secure (2 days max, 4 hours idle)
- ✅ User-friendly (auto-login if active)
- ✅ Industry standard for payment apps
- ✅ Easy to adjust in Auth0 Dashboard

For questions or adjustments, refer to the "Adjusting Session Duration" section above.
