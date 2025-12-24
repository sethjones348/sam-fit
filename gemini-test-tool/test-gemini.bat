@echo off
setlocal enabledelayedexpansion

REM Gemini API Image Test Tool
REM Reads PROMPT.txt and finds first image in directory

echo ========================================
echo Gemini API Image Test Tool
echo ========================================
echo.

REM Get API key
set "API_KEY="

REM Try API_KEY.txt file first
if exist API_KEY.txt (
    for /f "usebackq delims=" %%a in ("API_KEY.txt") do (
        set "API_KEY=%%a"
        set "API_KEY=!API_KEY: =!"
    )
)

REM Try environment variable
if "!API_KEY!"=="" (
    set "API_KEY=%VITE_GEMINI_API_KEY%"
)

if "!API_KEY!"=="" (
    echo ERROR: API key not found!
    echo.
    echo Please either:
    echo   1. Create API_KEY.txt file with your API key, or
    echo   2. Set VITE_GEMINI_API_KEY environment variable
    echo.
    echo See INSTRUCTIONS.txt for details.
    pause
    exit /b 1
)

echo API Key found: !API_KEY:~0,10!...
echo.

REM Read prompt from PROMPT.txt
if not exist PROMPT.txt (
    echo ERROR: PROMPT.txt not found!
    echo Please make sure PROMPT.txt exists in this directory.
    pause
    exit /b 1
)

set "PROMPT="
for /f "usebackq delims=" %%a in ("PROMPT.txt") do (
    set "LINE=%%a"
    if defined PROMPT (
        set "PROMPT=!PROMPT! !LINE!"
    ) else (
        set "PROMPT=!LINE!"
    )
)

echo Prompt loaded from PROMPT.txt
echo.

REM Find first image file
set "IMAGE_FILE="
for %%F in (*.jpg *.jpeg *.png *.webp *.gif) do (
    if not defined IMAGE_FILE (
        set "IMAGE_FILE=%%F"
    )
)

if "!IMAGE_FILE!"=="" (
    echo ERROR: No image file found!
    echo.
    echo Please place an image file (.jpg, .jpeg, .png, .webp, or .gif) in this directory.
    pause
    exit /b 1
)

echo Image file found: !IMAGE_FILE!
echo.

REM Detect MIME type
set "MIME_TYPE=image/png"
set "EXT=%~x1"
if /i "!IMAGE_FILE:~-4!"==".jpg" set "MIME_TYPE=image/jpeg"
if /i "!IMAGE_FILE:~-4!"=="jpeg" set "MIME_TYPE=image/jpeg"
if /i "!IMAGE_FILE:~-4!"==".png" set "MIME_TYPE=image/png"
if /i "!IMAGE_FILE:~-4!"=="webp" set "MIME_TYPE=image/webp"
if /i "!IMAGE_FILE:~-4!"==".gif" set "MIME_TYPE=image/gif"

echo Converting image to base64...

REM Convert image to base64
set "TEMP_B64=%TEMP%\gemini_%RANDOM%.b64"
certutil -encode "!IMAGE_FILE!" "!TEMP_B64!" >nul 2>&1

if errorlevel 1 (
    echo ERROR: Failed to convert image to base64
    pause
    exit /b 1
)

REM Read base64 data
set "BASE64_DATA="
for /f "skip=1 delims=" %%a in ('type "!TEMP_B64!"') do (
    set "LINE=%%a"
    if not "!LINE:~0,5!"=="-----" (
        set "BASE64_DATA=!BASE64_DATA!!LINE!"
    )
)

del "!TEMP_B64!" >nul 2>&1

echo Image converted
echo.

echo Sending request to Gemini API (using gemini-2.5-flash)...
echo.

REM Create JSON file
set "JSON_FILE=%TEMP%\gemini_%RANDOM%.json"

REM Escape quotes and backslashes in prompt
set "ESCAPED_PROMPT=!PROMPT!"
set "ESCAPED_PROMPT=!ESCAPED_PROMPT:"=\"!"
set "ESCAPED_PROMPT=!ESCAPED_PROMPT:\=\\!"

(
    echo {^
    echo   "contents": [{^
    echo     "parts": [^
    echo       {^
    echo         "inlineData": {^
    echo           "data": "!BASE64_DATA!",^
    echo           "mimeType": "!MIME_TYPE!"^
    echo         }^
    echo       },^
    echo       {^
    echo         "text": "!ESCAPED_PROMPT!"^
    echo       }^
    echo     ]^
    echo   }]^
    echo }
) > "!JSON_FILE!"

REM Make API call
set "URL=https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=!API_KEY!"
set "RESPONSE_FILE=%TEMP%\gemini_response_%RANDOM%.json"

curl -s -X POST "!URL!" -H "Content-Type: application/json" -d "@!JSON_FILE!" > "!RESPONSE_FILE!" 2>nul

if errorlevel 1 (
    echo ERROR: Request failed. Please check your API key and internet connection.
    del "!JSON_FILE!" >nul 2>&1
    pause
    exit /b 1
)

REM Check for errors
findstr /c:"\"error\"" "!RESPONSE_FILE!" >nul 2>&1
if not errorlevel 1 (
    echo ERROR: API returned an error:
    type "!RESPONSE_FILE!"
    del "!JSON_FILE!" >nul 2>&1
    del "!RESPONSE_FILE!" >nul 2>&1
    pause
    exit /b 1
)

REM Success!
echo.
echo ========================================
echo SUCCESS
echo ========================================
echo.

REM Try to extract the text field from JSON response
REM The structure is: .candidates[0].content.parts[0].text
REM We'll look for the "text" field in the parts array
set "EXTRACTED_TEXT="
set "IN_TEXT_FIELD=0"
set "TEXT_LINE="

REM Read the response file line by line to find the text field
for /f "usebackq tokens=*" %%a in ("!RESPONSE_FILE!") do (
    set "LINE=%%a"
    
    REM Check if we're entering the text field
    echo !LINE! | findstr /c:"\"text\"" >nul 2>&1
    if not errorlevel 1 (
        REM Found "text" field, extract the value
        REM Remove everything before "text":
        set "TEXT_LINE=!LINE!"
        set "TEXT_LINE=!TEXT_LINE:*"text": "=!"
        REM Remove the closing quote and everything after
        for /f "tokens=1 delims=^"" %%b in ("!TEXT_LINE!") do set "EXTRACTED_TEXT=%%b"
        goto :found_text
    )
)

:found_text
if defined EXTRACTED_TEXT (
    if not "!EXTRACTED_TEXT!"=="null" (
        echo Extracted Text:
        echo ----------------------------------------
        REM Basic unescaping - replace \n with newlines, \\ with \, etc.
        set "EXTRACTED_TEXT=!EXTRACTED_TEXT:\n= !"
        set "EXTRACTED_TEXT=!EXTRACTED_TEXT:\\=\!"
        set "EXTRACTED_TEXT=!EXTRACTED_TEXT:\"=!"
        echo !EXTRACTED_TEXT!
        echo ----------------------------------------
        echo.
    )
)

echo Full JSON Response:
echo.
type "!RESPONSE_FILE!"

echo.
echo ========================================
echo.
echo Test completed successfully!
echo.

REM Cleanup
del "!JSON_FILE!" >nul 2>&1
del "!RESPONSE_FILE!" >nul 2>&1

pause
exit /b 0

