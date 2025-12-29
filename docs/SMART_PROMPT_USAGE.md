# Smart Prompt Feature - Usage Guide

## Overview

The smart prompt is now the **default** prompt. It leverages AI's domain knowledge about CrossFit workouts to handle edge cases during text extraction. This reduces the need for extensive edge case handling in code.

## Using the Legacy Prompt

The smart prompt is enabled by default. To use the old prompt (without labels or inference), set the environment variable `USE_LEGACY_PROMPT=true`.

### In Browser (Vite)
Add to your `.env` file:
```
VITE_USE_LEGACY_PROMPT=true
```

### In Node.js/Jest
Set in your environment:
```bash
export USE_LEGACY_PROMPT=true
```

Or in your test setup:
```javascript
process.env.USE_LEGACY_PROMPT = 'true';
```

## What the Smart Prompt Does

### 1. Provides Domain Context
- Tells AI the image is a CrossFit WOD/lift on a whiteboard
- Enables AI to use CrossFit terminology knowledge

### 2. Handles Edge Cases
- **Abbreviations**: "3rvs" → "3 rounds"
- **Dittos**: Quotation marks → expanded to full text
- **Missing amounts**: Infers amounts from context (pyramid/ladder schemes)
- **Vertical text**: Separates side notes and annotations

### 3. Semantic Labeling
- Pre-categorizes lines as: `TITLE`, `MOVEMENT`, `INSTRUCTION`, or `SCORE`
- Simplifies parsing logic by routing lines based on labels

## Output Format

### With Smart Prompt (default)
```
TITLE: AMRAP 10 min
MOVEMENT: 30 | Double Unders
INSTRUCTION: Rest | 1:00
SCORE: 8 + 25
```

### With Legacy Prompt (USE_LEGACY_PROMPT=true)
```
AMRAP 10 min
30 | Double Unders
Rest | 1:00
8 + 25
```

## Testing

### Compare Both Prompts
1. Test with smart prompt (default - no env variable needed)
2. Test with `USE_LEGACY_PROMPT=true` to use legacy prompt
3. Compare results for accuracy and edge case handling

### Expected Improvements
- Better handling of abbreviations
- Better handling of dittos
- More consistent pipe placement
- Pre-categorized lines (for future parsing optimization)

## Current Status

**Implementation Complete** ✅
- Smart prompt is now the default
- Both OpenAI and Gemini extraction functions updated
- Label parsing implemented
- Legacy prompt available via `USE_LEGACY_PROMPT=true` for backward compatibility

**Phase 2: Future Work** (Not yet implemented)
- Use labels to simplify parsing logic
- Route lines based on AI labels
- Reduce classification code

**Phase 3: Future Work** (Not yet implemented)
- Trust AI inference for edge cases
- Remove redundant edge case handling code
- Monitor accuracy and adjust

## Troubleshooting

### Labels Not Appearing
- Check that `USE_LEGACY_PROMPT` is not set (smart prompt is default)
- Check console logs for "(smart prompt)" message (not "(legacy prompt)")
- Verify AI output contains label prefixes

### Parsing Errors
- Smart prompt is the default and handles most cases better
- If issues occur, try legacy prompt with `USE_LEGACY_PROMPT=true`
- Report issues with raw output for debugging

## Metrics to Track

When testing the smart prompt, monitor:
1. **Accuracy**: Do extractions match expected results?
2. **Edge Cases**: Are abbreviations, dittos, missing amounts handled correctly?
3. **Token Usage**: Does inference increase API costs?
4. **Performance**: Any latency impact?

## Next Steps

1. Test with existing test suite
2. Compare results between prompts
3. Measure accuracy and cost
4. Decide on Phase 2 implementation (using labels for parsing)

