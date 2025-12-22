# Gemini API Prompt Design

## Overview
This document defines the prompts used with the Google Gemini API to extract workout information from whiteboard photos. The prompts are designed to handle both MVP (simple text extraction) and full structured data extraction.

## Data Model Reference

```typescript
interface Workout {
  id: string;
  date: string; // ISO-8601
  rawText: string[]; // All lines of text from whiteboard
  extractedData: {
    type: "time" | "reps" | "unknown";
    rounds: number | null;
    movements: string[];
    times: number[] | null; // In seconds, for time-based workouts
    reps: number[] | null; // For reps-based workouts
  };
  imageUrl: string; // base64 or drive file ID
  metadata: {
    confidence?: number;
    notes?: string;
  };
}
```

## Prompt Strategy

### Approach 1: Two-Stage Extraction (Recommended for MVP)
1. **Stage 1**: Simple text extraction (OCR) - always succeeds
2. **Stage 2**: Structured extraction - attempts to parse, but falls back gracefully

### Approach 2: Single-Stage Extraction
One prompt that does both text extraction and structured parsing in a single call.

**Recommendation**: Start with Approach 1 for MVP, then optimize to Approach 2 if needed.

---

## MVP Prompt (Simple Text Extraction)

**Purpose**: Extract all text lines from the whiteboard image. This is the minimum viable extraction that always works.

### Prompt Template

```
You are analyzing a photo of a whiteboard with a workout written on it. 

Your task is to extract ALL text visible on the whiteboard, line by line, exactly as written. 

Instructions:
1. Read all text from top to bottom, left to right
2. Preserve the original line breaks and structure
3. Include all numbers, letters, and symbols exactly as they appear
4. If text is unclear or partially obscured, include your best interpretation
5. Do not add, remove, or modify any text
6. Return ONLY a JSON array of strings, where each string is one line of text

Output format (JSON only, no markdown, no explanation):
["line 1 text", "line 2 text", "line 3 text", ...]

Example output:
["5 Rounds", "10 Deadlifts", "15 Push-ups", "20 Sit-ups", "Time: 12:34"]
```

### Expected Response Format

```json
[
  "5 Rounds",
  "10 Deadlifts",
  "15 Push-ups",
  "20 Sit-ups",
  "Time: 12:34"
]
```

### Error Handling
- If image is not a whiteboard or has no text, return empty array: `[]`
- If text is completely unreadable, return array with placeholder: `["[Text unreadable]"]`

---

## Full Extraction Prompt (Structured Data)

**Purpose**: Extract structured workout data including type, rounds, movements, times/reps.

### Prompt Template

```
You are analyzing a photo of a whiteboard with a CrossFit-style workout written on it.

Extract the workout information and return it as structured JSON data.

Workout Types:
- "time": Workout is completed for time (has time measurements)
- "reps": Workout is completed for total reps (has rep counts)
- "unknown": Cannot determine workout type

Common Patterns:
- Rounds-based: "5 Rounds", "3 Rounds for time", "AMRAP 10"
- Time-based: Usually has "Time:" or "For time" or individual round times
- Reps-based: Usually has total rep counts or "For reps"

Extraction Rules:
1. Extract ALL raw text lines exactly as written (preserve original text)
2. Identify workout type (time, reps, or unknown)
3. Extract number of rounds if specified (look for "X Rounds", "X rounds", "Round X", etc.)
4. Extract all movements/exercises (common CrossFit movements: deadlifts, push-ups, sit-ups, burpees, pull-ups, etc.)
5. If time-based: Extract all time measurements (convert to seconds if in MM:SS format)
6. If reps-based: Extract all rep counts
7. Be flexible with formatting - workouts can be written in many ways

Output Requirements:
- Return ONLY valid JSON, no markdown, no code blocks, no explanations
- Use null for missing optional fields
- Use empty arrays [] for missing lists
- Round times should be in seconds (e.g., "12:34" = 754 seconds)
- Movements should be normalized (capitalize first letter, remove extra spaces)

Output JSON Schema:
{
  "rawText": ["line 1", "line 2", ...],
  "type": "time" | "reps" | "unknown",
  "rounds": number | null,
  "movements": ["Movement 1", "Movement 2", ...],
  "times": [number, ...] | null,  // Array of times in seconds, one per round
  "reps": [number, ...] | null,    // Array of rep counts, one per round or total
  "confidence": number              // 0-1, how confident you are in the extraction
}

Examples:

Example 1 - Time-based with rounds:
Input whiteboard:
"5 Rounds
10 Deadlifts
15 Push-ups
Time: 12:34"

Output:
{
  "rawText": ["5 Rounds", "10 Deadlifts", "15 Push-ups", "Time: 12:34"],
  "type": "time",
  "rounds": 5,
  "movements": ["Deadlifts", "Push-ups"],
  "times": [754],
  "reps": null,
  "confidence": 0.95
}

Example 2 - Reps-based:
Input whiteboard:
"Max Reps in 10 minutes
Burpees"

Output:
{
  "rawText": ["Max Reps in 10 minutes", "Burpees"],
  "type": "reps",
  "rounds": null,
  "movements": ["Burpees"],
  "times": null,
  "reps": [null],  // Total reps not specified, but it's reps-based
  "confidence": 0.9
}

Example 3 - Multiple round times:
Input whiteboard:
"3 Rounds
10 Pull-ups
Round 1: 2:15
Round 2: 2:08
Round 3: 2:22"

Output:
{
  "rawText": ["3 Rounds", "10 Pull-ups", "Round 1: 2:15", "Round 2: 2:08", "Round 3: 2:22"],
  "type": "time",
  "rounds": 3,
  "movements": ["Pull-ups"],
  "times": [135, 128, 142],
  "reps": null,
  "confidence": 0.98
}

Now analyze the provided image and return the JSON.
```

### Expected Response Format

```json
{
  "rawText": [
    "5 Rounds",
    "10 Deadlifts",
    "15 Push-ups",
    "20 Sit-ups",
    "Time: 12:34"
  ],
  "type": "time",
  "rounds": 5,
  "movements": ["Deadlifts", "Push-ups", "Sit-ups"],
  "times": [754],
  "reps": null,
  "confidence": 0.95
}
```

---

## Hybrid Prompt (Recommended for Production)

**Purpose**: Extract both raw text (always) and structured data (when possible), with graceful fallback.

### Prompt Template

```
You are analyzing a photo of a whiteboard with a workout written on it.

Your task is to:
1. Extract ALL text lines exactly as written (this is required)
2. Attempt to extract structured workout data (this is optional, do your best)

Workout Types:
- "time": Has time measurements (e.g., "Time: 12:34", "For time", round times)
- "reps": Has rep counts or "For reps"
- "unknown": Cannot determine

Extraction Guidelines:
- Always extract raw text lines (preserve original formatting)
- Identify workout type if clear
- Extract rounds if specified ("X Rounds", "Round X", etc.)
- Extract movements/exercises (common CrossFit movements)
- Extract times (convert MM:SS to seconds) if time-based
- Extract rep counts if reps-based
- Be flexible - workouts can be formatted many ways
- If uncertain about structured data, set type to "unknown" and include what you can

Output Requirements:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- rawText is REQUIRED (always return all text lines)
- Other fields are optional - use null if unknown
- Times in seconds (e.g., "12:34" = 754)
- Movements normalized (capitalize, clean spacing)
- Confidence: 0-1 score of extraction certainty

JSON Schema:
{
  "rawText": ["line 1", "line 2", ...],  // REQUIRED - all text lines
  "type": "time" | "reps" | "unknown",
  "rounds": number | null,
  "movements": ["Movement 1", ...] | [],
  "times": [number, ...] | null,  // seconds
  "reps": [number, ...] | null,
  "confidence": number  // 0-1
}

Analyze the image and return the JSON.
```

---

## Implementation Notes

### API Call Structure

```typescript
async function extractWorkout(imageBase64: string): Promise<WorkoutExtraction> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  
  const prompt = getExtractionPrompt(); // Use hybrid prompt
  
  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: "image/png" // or "image/jpeg"
      }
    },
    { text: prompt }
  ]);
  
  const response = result.response;
  const text = response.text();
  
  // Parse JSON from response
  // Handle cases where response might have markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text;
  
  return JSON.parse(jsonText);
}
```

### Response Parsing

**Important**: Gemini may wrap JSON in markdown code blocks. Always extract JSON:

```typescript
function parseGeminiResponse(response: string): WorkoutExtraction {
  // Remove markdown code blocks if present
  let jsonText = response.trim();
  
  // Remove ```json and ``` if present
  jsonText = jsonText.replace(/^```json\s*/i, '');
  jsonText = jsonText.replace(/^```\s*/, '');
  jsonText = jsonText.replace(/\s*```$/, '');
  
  // Extract JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  
  return JSON.parse(jsonMatch[0]);
}
```

### Error Handling

```typescript
async function extractWorkoutSafe(imageBase64: string): Promise<WorkoutExtraction> {
  try {
    const result = await extractWorkout(imageBase64);
    
    // Validate required fields
    if (!result.rawText || !Array.isArray(result.rawText)) {
      throw new Error('Invalid response: rawText missing');
    }
    
    // Ensure rawText has at least one line
    if (result.rawText.length === 0) {
      result.rawText = ['[No text detected]'];
    }
    
    // Set defaults for missing fields
    return {
      rawText: result.rawText,
      type: result.type || 'unknown',
      rounds: result.rounds ?? null,
      movements: result.movements || [],
      times: result.times ?? null,
      reps: result.reps ?? null,
      confidence: result.confidence ?? 0.5
    };
    
  } catch (error) {
    // Fallback: return minimal extraction
    return {
      rawText: ['[Extraction failed]'],
      type: 'unknown',
      rounds: null,
      movements: [],
      times: null,
      reps: null,
      confidence: 0
    };
  }
}
```

---

## Prompt Variations

### Variation 1: More Explicit Instructions

Add to prompt:
```
Important Notes:
- If you see "For time" or "Time:" anywhere, it's a time-based workout
- If you see "For reps" or total rep counts, it's a reps-based workout
- Rounds can be written as "5 Rounds", "5 rounds", "Round 5", "5x", etc.
- Times can be in format "12:34", "12m 34s", "754 seconds", etc.
- Movements are typically on separate lines or separated by commas
- Ignore any non-workout text (dates, names, etc.) but include in rawText
```

### Variation 2: CrossFit-Specific

Add to prompt:
```
Common CrossFit Movements to recognize:
- Deadlifts, Squats, Push-ups, Pull-ups, Sit-ups, Burpees
- Box Jumps, Double-unders, Kettlebell Swings, Wall Balls
- Running (400m, 800m, etc.), Rowing, Assault Bike
- Snatch, Clean & Jerk, Overhead Squat, etc.

Common Workout Formats:
- "X Rounds for time" - time-based with X rounds
- "AMRAP X" - As Many Rounds As Possible in X minutes (time-based)
- "EMOM X" - Every Minute On the Minute for X minutes
- "For time" - complete as fast as possible (time-based)
- "For reps" - complete for maximum reps (reps-based)
```

### Variation 3: Conservative (MVP-First)

Simpler prompt that prioritizes text extraction:
```
Extract all text from this whiteboard image, line by line.

Return a JSON object with:
{
  "rawText": ["line 1", "line 2", ...]
}

If you can identify workout structure, also include:
{
  "rawText": [...],
  "type": "time" | "reps" | "unknown",
  "movements": ["movement1", ...]
}

But rawText is the most important - always include it.
```

---

## Testing & Refinement

### Test Cases

1. **Simple time-based workout**
   - Input: "5 Rounds\n10 Deadlifts\nTime: 12:34"
   - Expected: type="time", rounds=5, movements=["Deadlifts"], times=[754]

2. **Reps-based workout**
   - Input: "Max Reps\nBurpees"
   - Expected: type="reps", movements=["Burpees"]

3. **Multiple round times**
   - Input: "3 Rounds\n10 Pull-ups\nR1: 2:15\nR2: 2:08"
   - Expected: type="time", rounds=3, times=[135, 128]

4. **Unclear format**
   - Input: Handwritten, messy text
   - Expected: rawText extracted, type="unknown", low confidence

5. **No workout (just notes)**
   - Input: Random text, not a workout
   - Expected: rawText extracted, type="unknown"

### Refinement Process

1. Test with example photos from `example-photos/` folder
2. Review extraction accuracy
3. Adjust prompt based on common errors
4. Add specific instructions for patterns that fail
5. Iterate until acceptable accuracy (80%+ for structured, 100% for rawText)

---

## Cost Considerations

- **Gemini Pro Vision**: Free tier is generous, but monitor usage
- **Prompt length**: Longer prompts cost more tokens
- **Recommendation**: Start with hybrid prompt, optimize length if needed
- **Caching**: Consider caching extractions for same images (if user re-uploads)

---

## Future Enhancements

1. **Multi-image support**: Handle multiple photos of same workout
2. **Handwriting recognition**: Improve for handwritten whiteboards
3. **Workout templates**: Learn common workout patterns
4. **Confidence scoring**: Use confidence to flag uncertain extractions
5. **User corrections**: Learn from user edits to improve future extractions

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Vision Capabilities](https://ai.google.dev/gemini-api/docs/get-started/vision)
- CrossFit workout formats and terminology

