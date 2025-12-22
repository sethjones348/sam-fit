# OAuth Setup Guide - Fixing redirect_uri_mismatch Error

## The Problem
You're seeing "Error 400: redirect_uri_mismatch" because the redirect URI in Google Cloud Console doesn't match what the app is sending.

## Solution

### Step 1: Go to Google Cloud Console
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

### Step 2: Configure Authorized JavaScript Origins
Add these **exact** URLs (one per line):
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

**Why multiple ports?** Vite may use port 5174 if 5173 is busy. Adding both ensures it works regardless.

### Step 3: Configure Authorized Redirect URIs
For `@react-oauth/google`, add these redirect URIs:
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
```

**Important Notes:**
- Include the protocol (`http://` not just `localhost:5173`)
- No trailing slashes
- Include both `localhost` and `127.0.0.1` variants
- Make sure there are no extra spaces

### Step 4: Save and Wait
- Click **Save**
- Wait 1-2 minutes for changes to propagate
- Clear your browser cache or use incognito mode
- Try logging in again

## Alternative: Check Current Configuration

If you want to see what redirect URI the app is actually using, check the browser console for any OAuth-related errors. The `@react-oauth/google` library typically uses `postMessage` for the popup flow, but the JavaScript origin must still be configured.

## Still Not Working?

1. **Double-check the Client ID**: Make sure the Client ID in `.env.local` matches exactly what's in Google Cloud Console
2. **Check for typos**: Common mistakes:
   - Missing `http://`
   - Trailing slashes (`http://localhost:5173/`)
   - Wrong port number
   - Using `https://` instead of `http://` for localhost
3. **Try incognito mode**: Sometimes browser extensions interfere
4. **Check the exact error**: Look at the error details link in the Google error page for the exact redirect URI being used

