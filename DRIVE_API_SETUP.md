# Google Drive API 403 Error Fix

## Problem
Getting `403 Forbidden` when trying to access Google Drive API.

## Solutions

### 1. Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Click on it and press **ENABLE**
4. Wait a few minutes for it to activate

### 2. Update OAuth Scopes
The app now requests both:
- `https://www.googleapis.com/auth/drive.file` (for app-created files)
- `https://www.googleapis.com/auth/drive` (for broader access)

**You need to:**
1. Log out of the app
2. Log back in
3. You'll be prompted to grant Drive permissions again
4. Make sure to approve all requested permissions

### 3. Verify OAuth Consent Screen
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Make sure these scopes are listed:
   - `.../auth/drive.file`
   - `.../auth/drive` (if you want broader access)
3. Click **SAVE**

### 4. Test Drive API Access
After enabling and re-authenticating, try saving a workout again.

## Quick Fix Steps
1. ✅ Enable Google Drive API in Google Cloud Console
2. ✅ Log out of the app
3. ✅ Log back in (approve Drive permissions)
4. ✅ Try saving a workout again

## Still Not Working?

Check the browser console for the exact error message. Common issues:
- **403 Forbidden**: API not enabled or insufficient permissions
- **401 Unauthorized**: Token expired, need to log out/in
- **400 Bad Request**: Invalid request format

