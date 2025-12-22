# Custom Domain Setup for GitHub Pages

## Problem
GitHub Pages shows "DNS check unsuccessful" - this means the DNS records aren't configured correctly.

## Solution: Configure DNS Records in Porkbun

You need to add DNS records in your Porkbun domain management to point `samfit.xyz` to GitHub Pages.

### Option 1: Use Apex Domain (samfit.xyz) - Recommended for Simplicity

1. **Go to Porkbun DNS Management**:
   - In your Porkbun dashboard, find `samfit.xyz`
   - Click on "DNS" or "DNS Records" section
   - You should see where to add/edit DNS records

2. **Add A Records** (for apex domain):
   Add these 4 A records (all pointing to GitHub Pages IPs):
   ```
   Type: A
   Host: @ (or leave blank, or samfit.xyz)
   Answer: 185.199.108.153
   TTL: 600 (or default)
   
   Type: A
   Host: @
   Answer: 185.199.109.153
   
   Type: A
   Host: @
   Answer: 185.199.110.153
   
   Type: A
   Host: @
   Answer: 185.199.111.153
   ```

3. **Wait for DNS Propagation**:
   - DNS changes can take 24-48 hours to propagate
   - Usually works within a few minutes to an hour
   - Use a tool like https://dnschecker.org to check propagation

4. **In GitHub Pages**:
   - Go to Settings → Pages
   - Under "Custom domain", enter: `samfit.xyz`
   - Click "Save"
   - Wait a few minutes, then click "Check again"

### Option 2: Use www Subdomain (www.samfit.xyz) - Easier Alternative

1. **In Porkbun DNS**:
   Add a CNAME record:
   ```
   Type: CNAME
   Host: www
   Answer: sethjones348.github.io
   TTL: 600
   ```

2. **In GitHub Pages**:
   - Enter: `www.samfit.xyz`
   - Click "Save"

3. **Redirect apex to www** (optional):
   If you want `samfit.xyz` to redirect to `www.samfit.xyz`, you can:
   - Use Porkbun's URL forwarding feature
   - Or add A records pointing to GitHub and configure redirect in GitHub Pages

### Option 3: Both Apex and www (Best User Experience)

1. **Add A Records** (for samfit.xyz):
   ```
   A @ 185.199.108.153
   A @ 185.199.109.153
   A @ 185.199.110.153
   A @ 185.199.111.153
   ```

2. **Add CNAME** (for www.samfit.xyz):
   ```
   CNAME www sethjones348.github.io
   ```

3. **In GitHub Pages**:
   - Enter: `samfit.xyz` (GitHub will automatically configure www as well)
   - Check "Enforce HTTPS" once DNS is verified

## Step-by-Step for Porkbun

1. **Access DNS Records**:
   - Log into Porkbun
   - Go to your domain `samfit.xyz`
   - Look for "DNS" or "DNS Records" section
   - Click "Edit" or "Manage DNS"

2. **Remove Existing Records** (if any):
   - Delete any existing A or CNAME records for `samfit.xyz` or `@`

3. **Add New Records**:
   - Click "Add Record" or "+"
   - Add the 4 A records listed above
   - Or add the CNAME for www

4. **Save Changes**

5. **Verify**:
   - Wait 5-10 minutes
   - Go to GitHub Pages settings
   - Click "Check again"
   - Should show green checkmark

## Troubleshooting

### Still Getting DNS Error?

1. **Check DNS Propagation**:
   - Visit https://dnschecker.org
   - Enter `samfit.xyz`
   - Select "A" record type
   - Check if the GitHub IPs (185.199.108.153, etc.) appear globally

2. **Verify Records in Porkbun**:
   - Make sure records are saved
   - Check TTL values (should be 600 or lower for faster updates)
   - Ensure no conflicting records exist

3. **Common Issues**:
   - **Wrong IP addresses**: Make sure you're using GitHub's current IPs (listed above)
   - **TTL too high**: Lower TTL to 600 seconds for faster updates
   - **Cached DNS**: Clear your browser cache or use incognito mode
   - **Propagation delay**: Can take up to 48 hours (usually much faster)

4. **Test DNS Locally**:
   ```bash
   # Check A records
   dig samfit.xyz A
   
   # Check CNAME (if using www)
   dig www.samfit.xyz CNAME
   ```

### After DNS is Verified

1. **Enable HTTPS**:
   - Once DNS is verified, GitHub will automatically provision SSL
   - Check "Enforce HTTPS" checkbox
   - This may take a few minutes

2. **Update OAuth Settings**:
   - Go to Google Cloud Console
   - Update authorized origins:
     - `https://samfit.xyz`
     - `https://www.samfit.xyz` (if using www)
   - Update redirect URIs similarly

3. **Update Meta Tags** (if needed):
   - Update `index.html` og:url to use `https://samfit.xyz`
   - Update any hardcoded URLs in the app

## Current GitHub Pages IPs (as of 2024)

These are the current GitHub Pages IP addresses:
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

**Note**: GitHub may update these IPs. Check https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site for the latest IPs.

## Quick Reference

**For samfit.xyz (apex domain)**:
```
A @ 185.199.108.153
A @ 185.199.109.153
A @ 185.199.110.153
A @ 185.199.111.153
```

**For www.samfit.xyz (subdomain)**:
```
CNAME www sethjones348.github.io
```


