#!/bin/bash

# Gemini API Image Test Tool
# Reads PROMPT.txt and finds first image in directory

set -e

echo "========================================"
echo "Gemini API Image Test Tool"
echo "========================================"
echo

# Get API key
API_KEY=""

# Try API_KEY.txt file first
if [ -f API_KEY.txt ]; then
    API_KEY=$(cat API_KEY.txt | tr -d '[:space:]')
fi

# Try environment variable
if [ -z "$API_KEY" ]; then
    API_KEY="$VITE_GEMINI_API_KEY"
fi

if [ -z "$API_KEY" ]; then
    echo "ERROR: API key not found!"
    echo
    echo "Please either:"
    echo "  1. Create API_KEY.txt file with your API key, or"
    echo "  2. Set VITE_GEMINI_API_KEY environment variable"
    echo
    echo "See INSTRUCTIONS.txt for details."
    exit 1
fi

echo "API Key found: ${API_KEY:0:10}..."
echo

# Read prompt from PROMPT.txt
if [ ! -f PROMPT.txt ]; then
    echo "ERROR: PROMPT.txt not found!"
    echo "Please make sure PROMPT.txt exists in this directory."
    exit 1
fi

PROMPT=$(cat PROMPT.txt)

echo "Prompt loaded from PROMPT.txt"
echo

# Find first image file
IMAGE_FILE=""
shopt -s nullglob 2>/dev/null || true
for file in *.jpg *.jpeg *.png *.webp *.gif; do
    if [ -f "$file" ]; then
        IMAGE_FILE="$file"
        break
    fi
done
shopt -u nullglob 2>/dev/null || true

if [ -z "$IMAGE_FILE" ]; then
    echo "ERROR: No image file found!"
    echo
    echo "Please place an image file (.jpg, .jpeg, .png, .webp, or .gif) in this directory."
    exit 1
fi

echo "Image file found: $IMAGE_FILE"
echo

# Detect MIME type
MIME_TYPE="image/png"
EXT=$(echo "$IMAGE_FILE" | tr '[:upper:]' '[:lower:]' | sed 's/.*\.//')
case "$EXT" in
    jpg|jpeg)
        MIME_TYPE="image/jpeg"
        ;;
    png)
        MIME_TYPE="image/png"
        ;;
    webp)
        MIME_TYPE="image/webp"
        ;;
    gif)
        MIME_TYPE="image/gif"
        ;;
esac

echo "Converting image to base64..."

# Convert image to base64
if command -v base64 >/dev/null 2>&1; then
    BASE64_DATA=$(base64 -i "$IMAGE_FILE" 2>/dev/null || base64 "$IMAGE_FILE")
else
    echo "ERROR: base64 command not found"
    exit 1
fi

# Remove data URL prefix if present
BASE64_DATA=$(echo "$BASE64_DATA" | sed 's|data:image/[^;]*;base64,||')

echo "Image converted"
echo

echo "Sending request to Gemini API (using gemini-2.5-flash)..."
echo

# Create JSON payload file (to avoid "Argument list too long" error)
JSON_FILE=$(mktemp /tmp/gemini_request_XXXXXX.json)

# Escape the prompt for JSON (escape quotes and backslashes)
ESCAPED_PROMPT=$(echo "$PROMPT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

# Write JSON to file
cat > "$JSON_FILE" <<EOF
{
  "contents": [{
    "parts": [
      {
        "inlineData": {
          "data": "$BASE64_DATA",
          "mimeType": "$MIME_TYPE"
        }
      },
      {
        "text": "$ESCAPED_PROMPT"
      }
    ]
  }]
}
EOF

# Make API call using file
RESPONSE=$(curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=$API_KEY" \
    -H "Content-Type: application/json" \
    -d "@$JSON_FILE")

# Cleanup
rm -f "$JSON_FILE"

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "ERROR: API returned an error:"
    echo "$RESPONSE"
    exit 1
fi

# Success!
echo
echo "========================================"
echo "SUCCESS"
echo "========================================"
echo

# Extract and parse the response text
if command -v jq >/dev/null 2>&1; then
    # Use jq to extract the text field
    EXTRACTED_TEXT=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null)
    
    if [ -n "$EXTRACTED_TEXT" ] && [ "$EXTRACTED_TEXT" != "null" ]; then
        echo "Extracted Text:"
        echo "----------------------------------------"
        echo "$EXTRACTED_TEXT"
        echo "----------------------------------------"
        echo
        echo "Full JSON Response:"
        echo "$RESPONSE" | jq '.'
    else
        echo "Full JSON Response:"
        echo "$RESPONSE" | jq '.'
    fi
else
    # Basic extraction without jq - extract JSON object and parse text field
    # Try to find the text field in the response (handles multi-line JSON)
    # Look for pattern: "text": "..." or "text":"..."
    EXTRACTED_TEXT=$(echo "$RESPONSE" | grep -oP '"text"\s*:\s*"([^"\\]|\\.)*"' | head -1 | sed 's/"text"\s*:\s*"//;s/"$//' | sed 's/\\n/\n/g; s/\\"/"/g; s/\\\\/\\/g' 2>/dev/null)
    
    # If that didn't work, try a simpler approach
    if [ -z "$EXTRACTED_TEXT" ] || [ "$EXTRACTED_TEXT" == "null" ]; then
        # Extract text between "text":" and the next quote (handling escaped quotes)
        EXTRACTED_TEXT=$(echo "$RESPONSE" | sed -n 's/.*"text"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1 | sed 's/\\n/\n/g; s/\\"/"/g; s/\\\\/\\/g' 2>/dev/null)
    fi
    
    if [ -n "$EXTRACTED_TEXT" ] && [ "$EXTRACTED_TEXT" != "null" ] && [ -n "${EXTRACTED_TEXT// }" ]; then
        echo "Extracted Text:"
        echo "----------------------------------------"
        echo "$EXTRACTED_TEXT"
        echo "----------------------------------------"
        echo
        echo "Full JSON Response:"
        echo "$RESPONSE"
    else
        echo "Full JSON Response:"
        echo "$RESPONSE"
        echo
        echo "Note: Install 'jq' for better JSON parsing (e.g., 'brew install jq' on Mac)"
    fi
fi

echo
echo "========================================"
echo
echo "Test completed successfully!"
echo

