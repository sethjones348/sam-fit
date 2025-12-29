# Complete OAuth Setup Guide

## Current Status
- Client ID: `351760379502-3k7o4uc03ta0gd4ua174hs61jn3r13gv.apps.googleusercontent.com`
- Error: 403 access_denied
- App is in Testing mode

## Step-by-Step Fix

### 1. OAuth Consent Screen Configuration

Go to: [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)

**Required Settings:**
- **User Type**: External (for personal use)
- **App name**: WODsApp
- **User support email**: Your email
- **Developer contact information**: Your email

**Scopes** (make sure these are added):
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `.../auth/drive.file`

**Test Users** (CRITICAL):
1. Scroll to "Test users" section
2. Click **+ ADD USERS**
3. Add: `sethjones348@gmail.com`
4. Click **ADD**
5. Click **SAVE** at the bottom

### 2. Credentials Configuration

Go to: [Credentials](https://console.cloud.google.com/apis/credentials)

Click on your OAuth 2.0 Client ID

**Authorized JavaScript origins** (add ALL of these):
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

**Authorized redirect URIs** (add these):
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

**Note**: The `storagerelay://` URI is handled automatically by the library - you don't need to add it.

### 3. Enable Required APIs

Go to: [APIs & Services](https://console.cloud.google.com/apis/library)

Make sure these are **ENABLED**:
- ✅ Google Drive API
- ✅ Google+ API (for user info) - or Google Identity API

### 4. Wait and Clear Cache

1. **Wait 2-3 minutes** after making changes
2. **Clear browser cache** or use **Incognito/Private mode**
3. **Close all browser tabs** with the app
4. **Restart the dev server**:
   ```bash
   npm run dev
   ```

### 5. Verify Environment Variables

Check `.env.local` has the correct Client ID:
```
VITE_GOOGLE_CLIENT_ID=351760379502-3k7o4uc03ta0gd4ua174hs61jn3r13gv.apps.googleusercontent.com
```

After updating, **restart the dev server**.

## Common Issues

### Issue: "App is in testing mode"
**Solution**: Add yourself as a test user in OAuth Consent Screen

### Issue: "redirect_uri_mismatch"
**Solution**: Make sure JavaScript origins include the exact port (5173 or 5174)

### Issue: "access_denied" after adding test user
**Solution**: 
- Wait 2-3 minutes
- Use incognito mode
- Make sure you're signing in with the exact email you added

### Issue: Scopes not approved
**Solution**: Make sure all required scopes are listed in OAuth Consent Screen

## Testing Checklist

- [ ] OAuth Consent Screen configured
- [ ] Test user added (`sethjones348@gmail.com`)
- [ ] JavaScript origins added (ports 5173 and 5174)
- [ ] Redirect URIs added
- [ ] Google Drive API enabled
- [ ] Google+ API or Identity API enabled
- [ ] `.env.local` has correct Client ID
- [ ] Waited 2-3 minutes after changes
- [ ] Cleared browser cache / using incognito
- [ ] Restarted dev server

## Still Not Working?

1. Check the browser console for detailed error messages
2. Verify the Client ID in `.env.local` matches Google Cloud Console exactly
3. Try a different browser
4. Check if you're signed into multiple Google accounts - try signing out of all except the test account

