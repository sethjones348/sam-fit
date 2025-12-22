# Quick DNS Verification Guide

## Check if DNS is Propagating

### 1. Use DNS Checker (Recommended)
Visit: https://dnschecker.org

1. Enter: `samfit.xyz`
2. Select record type: **A**
3. Click "Search"
4. Look for the GitHub IPs (185.199.108.153, 185.199.109.153, etc.) to appear in different locations worldwide

**What to look for:**
- ✅ Green checkmarks showing the GitHub IPs
- ⚠️ If you see different IPs or "No record found", DNS hasn't propagated yet

### 2. Check Locally (Command Line)
```bash
# Check A records
dig samfit.xyz A

# Or on Windows/Mac
nslookup samfit.xyz
```

**Expected output should show:**
```
samfit.xyz.    IN    A    185.199.108.153
samfit.xyz.    IN    A    185.199.109.153
samfit.xyz.    IN    A    185.199.110.153
samfit.xyz.    IN    A    185.199.111.153
```

### 3. Verify in Porkbun
Double-check your DNS records in Porkbun:
- Go to DNS management
- Make sure all 4 A records are there
- Verify the IPs are exactly:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153
- Check that TTL is set (600 is good)

## Common Issues

### Issue: Records show but GitHub still says "DNS check unsuccessful"

**Solutions:**
1. **Wait longer**: Can take up to 48 hours (usually 10-30 minutes)
2. **Clear DNS cache**: 
   - Mac: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`
3. **Check for conflicting records**: Make sure there are no other A or CNAME records for `@` or `samfit.xyz`
4. **Verify TTL**: Lower TTL (like 600) helps with faster updates

### Issue: DNS checker shows different IPs

**Problem**: You might have old/cached records or wrong IPs configured.

**Solution**: 
- Double-check the IPs in Porkbun match GitHub's IPs exactly
- Remove any old A records
- Wait for propagation

### Issue: "No record found" everywhere

**Problem**: Records might not be saved in Porkbun.

**Solution**:
- Go back to Porkbun
- Verify records are actually saved (not just in draft)
- Make sure you're editing the correct domain
- Try removing and re-adding the records

## Timeline Expectations

- **Fastest**: 5-10 minutes (rare)
- **Typical**: 15-60 minutes
- **Slow**: 2-24 hours
- **Maximum**: 48 hours (very rare)

## After DNS Propagates

1. **In GitHub Pages**:
   - Click "Check again"
   - Should see green checkmark ✅
   - "Enforce HTTPS" will become available

2. **Wait for SSL**:
   - GitHub will automatically provision SSL certificate
   - Usually takes 10-30 minutes after DNS is verified
   - Then you can check "Enforce HTTPS"

3. **Test the site**:
   - Visit `https://samfit.xyz` (or `http://` first)
   - Should load your GitHub Pages site

## Quick Checklist

- [ ] Added 4 A records in Porkbun
- [ ] IPs are correct (185.199.108.153, etc.)
- [ ] Records are saved (not draft)
- [ ] Checked DNS propagation on dnschecker.org
- [ ] Waited at least 10-15 minutes
- [ ] Clicked "Check again" in GitHub Pages
- [ ] No conflicting DNS records


