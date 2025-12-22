# Testing Gemini API Access

## Issue
All Gemini models are returning 404 errors, suggesting the API key may not have access or model names are incorrect.

## Debugging Steps

### 1. Verify API Key
Check that your `.env.local` has a valid Gemini API key:
```bash
echo $VITE_GEMINI_API_KEY
# Or check .env.local file
```

### 2. Test API Key Directly
You can test if your API key works by making a direct API call:

```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

This should return a list of available models.

### 3. Check Available Models
The app now automatically tries to list available models. Check the browser console when uploading an image to see:
- Which models are available
- Which models are being tried
- The exact error messages

### 4. Common Issues

**API Key Issues:**
- Make sure you got the key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- The key should start with something like `AIza...`
- Make sure it's the Generative AI API key, not a different Google API key

**Model Access:**
- Some API keys may have limited model access
- Free tier may only have access to certain models
- Check your Google Cloud Console for API quotas and access

**Region Restrictions:**
- Some models may not be available in all regions
- Try using a VPN if you're in a restricted region

### 5. Alternative: Use Vertex AI
If the Generative AI API doesn't work, you might need to use Vertex AI instead, which requires:
- Google Cloud Project setup
- Different authentication (OAuth instead of API key)
- Different SDK/endpoints

## Next Steps

1. Check browser console for "Available models" log
2. Verify API key is correct and active
3. Try getting a new API key from Google AI Studio
4. Check if your Google account has access to Gemini models

