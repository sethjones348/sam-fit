# Bug Tracker

## Bug Template
```markdown
### [Bug Title]
**Date**: YYYY-MM-DD
**Status**: Open / In Progress / Fixed / Won't Fix
**Priority**: Critical / High / Medium / Low
**Component**: [e.g., Authentication, Upload, Storage, UI]

**Description**:
[What is the bug?]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen?]

**Actual Behavior**:
[What actually happens?]

**Environment**:
- Browser: 
- OS: 
- Device: 

**Screenshots/Error Messages**:
[Any relevant screenshots or error messages]

**Additional Notes**:
[Any other relevant information]
```

---

## Bugs

### Google Drive API 403 Forbidden Error
**Date**: 2024-12-21
**Status**: Fixed (requires user action)
**Priority**: High
**Component**: Storage Layer (Google Drive API)

**Description**:
Getting `403 Forbidden` error when trying to access Google Drive API to create/find folders. Error occurs when saving a workout.

**Error**:
```
GET https://www.googleapis.com/drive/v3/files?q=name='SamFit'... 403 (Forbidden)
```

**Steps to Reproduce**:
1. Sign in to the app
2. Upload and extract a workout
3. Click "Save Workout"
4. Error occurs

**Expected Behavior**:
Workout should be saved to Google Drive in a `SamFit/workouts/` folder.

**Actual Behavior**:
403 Forbidden error prevents Drive API access.

**Root Causes**:
1. Google Drive API may not be enabled in Google Cloud Console
2. OAuth scopes may be insufficient (`drive.file` only allows app-created files)
3. User may need to re-authenticate with new scopes

**Fix Applied**:
1. Updated OAuth scopes to include both `drive.file` and `drive` for broader access
2. Added better error messages with troubleshooting steps
3. Created `DRIVE_API_SETUP.md` guide

**User Action Required**:
1. Enable Google Drive API in [Google Cloud Console](https://console.cloud.google.com/apis/library)
2. Log out of the app
3. Log back in (will prompt for Drive permissions)
4. Approve all requested permissions
5. Try saving workout again

**Additional Notes**:
- The `drive.file` scope only allows access to files created by the app
- Adding `drive` scope provides broader access (user must approve)
- After enabling API and re-authenticating, should work correctly

---

### Gemini Model Name Error - gemini-pro-vision Not Found
**Date**: 2024-12-21
**Status**: Fixed
**Priority**: Critical
**Component**: AI/OCR Integration (Gemini API)

**Description**:
The workout extraction fails with error: `models/gemini-pro-vision is not found for API version v1`. The model name `gemini-pro-vision` is deprecated or not available in the current Gemini API.

**Steps to Reproduce**:
1. Sign in to the app
2. Navigate to Upload page
3. Upload a workout image
4. Error occurs during extraction

**Expected Behavior**:
Image should be processed and workout data extracted successfully.

**Actual Behavior**:
Error thrown: `GoogleGenerativeAIError: [GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent: [404 ] models/gemini-pro-vision is not found for API version v1`

**Error Stack**:
```
at makeRequest (@google_generative-ai.js?v=641dfec5:111:13)
at async generateContent (@google_generative-ai.js?v=641dfec5:345:20)
at async Object.extract (workoutExtractor.ts:84:22)
at async handleImageUpload (UploadPage.tsx:25:22)
```

**Fix Applied**:
1. Created test script (`test-gemini-simple.sh`) to identify available models
2. Discovered API provides Gemini 2.5/2.0 models, not 1.5
3. Updated model priority list to try:
   - `gemini-2.5-flash` (latest, fastest, supports vision) ✅ **CONFIRMED WORKING**
   - `gemini-2.5-pro` (latest, most capable, supports vision)
   - `gemini-2.0-flash` (version 2.0, supports vision)
   - `gemini-1.5-flash` (fallback)
   - `gemini-1.5-pro` (fallback)
   - `gemini-pro` (legacy fallback)

The code now automatically tries each model and uses the first one that works. Test script confirms `gemini-2.5-flash` works with the API key.

**Additional Notes**:
- The old `gemini-pro-vision` model has been deprecated
- If all models fail, a clear error message is shown
- Console logs indicate which model is being attempted/used
- Fallback returns minimal extraction data if all models fail
