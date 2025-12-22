# Fix OAuth 403: access_denied Error

## The Problem
Your app is in "Testing" mode, which means only approved test users can sign in. You need to add yourself as a test user.

## Solution: Add Test Users

### Step 1: Go to OAuth Consent Screen
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users
1. Scroll down to the **Test users** section
2. Click **+ ADD USERS**
3. Add your email address: `sethjones348@gmail.com`
4. Click **ADD**
5. Click **SAVE** at the bottom of the page

### Step 3: Wait and Retry
- Wait 1-2 minutes for changes to propagate
- Clear your browser cache or use incognito mode
- Try signing in again

## Alternative: Publish the App (Not Recommended for MVP)

If you want anyone to be able to sign in (not just test users), you can publish the app, but this requires:
- Privacy policy URL
- Terms of service URL
- App verification (can take weeks)

**For a single-user MVP, adding test users is the better approach.**

## Quick Checklist

- [ ] Added `sethjones348@gmail.com` as a test user
- [ ] Saved the OAuth consent screen
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache or used incognito
- [ ] Tried signing in again

