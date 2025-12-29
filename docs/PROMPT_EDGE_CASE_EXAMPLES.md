# Edge Case Examples: Current vs. New Prompt

This document shows specific examples of how the new prompt would handle edge cases that currently require extensive code.

## Example 1: Abbreviations

### Current Behavior
**Input**: Whiteboard shows "3rvs"
**AI Output**: "3rvs" (exact text)
**Code Handling**: None - abbreviation not recognized
**Result**: Parsing fails or produces incorrect result

### New Prompt Behavior
**Input**: Whiteboard shows "3rvs"
**AI Output**: "MOVEMENT: 3 rounds | ..."
**Code Handling**: Minimal - AI already expanded abbreviation
**Result**: Correctly parsed as "3 rounds"

## Example 2: Missing Amounts (Pyramid/Ladder)

### Current Behavior
**Input**: 
```
1-2-3-4-5-5-4-3-2-1
Burpees
```
**AI Output**:
```
1-2-3-4-5-5-4-3-2-1
Burpees
```
**Code Handling**: Lines 763-778 - Tracks `pendingAmount`, applies to next movement
**Result**: Works, but requires complex state tracking

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**:
```
MOVEMENT: 1-2-3-4-5-5-4-3-2-1 | Burpees
```
**AI Inference**: "lines with movement only may use amount from the line above"
**Code Handling**: Simple parsing - amount and exercise already together
**Result**: Works with simpler code

## Example 3: Dittos (Quotation Marks)

### Current Behavior
**Input**:
```
30 | Double Unders
" | "
```
**AI Output**:
```
30 | Double Unders
" | "
```
**Code Handling**: None - dittos not recognized
**Result**: Parsing fails or produces incorrect result

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**:
```
MOVEMENT: 30 | Double Unders
MOVEMENT: 30 | Double Unders
```
**AI Inference**: "quotations = ditto of similar lines above"
**Code Handling**: Simple parsing - ditto already expanded
**Result**: Correctly parsed as duplicate movement

## Example 4: Vertical/Side Text

### Current Behavior
**Input**: Whiteboard with side note "Rest 2:00 between rounds"
**AI Output**: May merge with main text or be lost
**Code Handling**: None - spatial context lost
**Result**: Side note may be missed or incorrectly merged

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**:
```
MOVEMENT: 30 | Double Unders
INSTRUCTION: Rest 2:00 between rounds
```
**AI Inference**: "Text that is visually off to the side or oriented vertically should be output as its own line"
**Code Handling**: Simple - already separated and labeled
**Result**: Correctly extracted and categorized

## Example 5: Line Classification

### Current Behavior
**Input**:
```
AMRAP 10 min
30 | Double Unders
Rest | 1:00
8 + 25
```
**AI Output**:
```
AMRAP 10 min
30 | Double Unders
Rest | 1:00
8 + 25
```
**Code Handling**: Lines 780-863 - Complex logic to classify:
- Skip "Rest" lines (lines 869-920)
- Skip score lines with "+" (lines 826-835)
- Parse movements (lines 951-1151)
**Result**: Works, but requires extensive classification code

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**:
```
TITLE: AMRAP 10 min
MOVEMENT: 30 | Double Unders
INSTRUCTION: Rest | 1:00
SCORE: 8 + 25
```
**AI Inference**: Semantic understanding of CrossFit workout structure
**Code Handling**: Simple routing based on labels:
- `TITLE:` → `parseTitle()`
- `MOVEMENT:` → `parseMovements()`
- `INSTRUCTION:` → `parseDescriptive()`
- `SCORE:` → `parseScores()`
**Result**: Works with much simpler code

## Example 6: Reversed Format

### Current Behavior
**Input**: "15 | cal | Bike"
**AI Output**: "15 | cal | Bike"
**Code Handling**: Lines 960-974 - Detects reversed format, reorders
**Result**: Works, but requires format detection logic

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**: "MOVEMENT: 15 | cal | Bike"
**AI Inference**: Understands CrossFit format conventions
**Code Handling**: Can still detect reversed format, but AI might normalize it
**Result**: Potentially simpler, or same complexity

## Example 7: Ambiguous Amounts

### Current Behavior
**Input**:
```
10
Burpees
20
Push-ups
```
**AI Output**:
```
10
Burpees
20
Push-ups
```
**Code Handling**: Lines 978-985 - Uses `pendingAmount` for pyramid schemes
**Result**: Works for pyramid, but ambiguous for other cases

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**:
```
MOVEMENT: 10 | Burpees
MOVEMENT: 20 | Push-ups
```
**AI Inference**: "line with amount only may be applied to lines below with movement only"
**Code Handling**: Simple parsing - AI already associated amounts
**Result**: Correctly parsed with simpler code

## Example 8: Complex Score Format

### Current Behavior
**Input**: "8 + 25 | 11/16/25"
**AI Output**: "8 + 25 | 11/16/25"
**Code Handling**: Lines 1695-1701 - Strips date, parses "rounds + reps"
**Result**: Works, but requires date stripping logic

### New Prompt Behavior
**Input**: Same whiteboard
**AI Output**: "SCORE: 8 + 25 | 11/16/25"
**AI Inference**: Understands score format, may separate date
**Code Handling**: Can still strip date, but label helps routing
**Result**: Slightly simpler, better categorization

## Code Reduction Estimate

### Current Classification Logic (Lines 780-863)
```typescript
// Skip section headers
if (firstColumn.match(/^(workout|score|rounds?|sets?|time|reps?)$/i)) {
    continue;
}

// Skip scores with "+"
if (trimmed.match(/\d+\s*\+\s*\d+/) || ...) {
    continue;
}

// Skip dates
if (trimmed.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
    continue;
}

// Skip numbered scores
if (col0.match(/^\d+\.$/) && col1 && !isNaN(parseInt(col1, 10))) {
    continue;
}

// Skip time cap results
if (trimmed.match(/\d+\s*rds?\s*@/i) || ...) {
    continue;
}

// Check for rest/descriptive elements
if (restMatch || reversedRestMatch) {
    // ... handle rest
    continue;
}

// Check for "@" symbol
if (firstColumn === '@' || trimmed.match(/^@\s*\|/)) {
    // ... handle descriptive
    continue;
}

// Skip time-only lines
if (timeOnlyMatch) {
    continue;
}
```

### With New Prompt (Simplified)
```typescript
const { label, content } = parseLabeledLine(line);

switch (label) {
    case 'MOVEMENT':
        return parseMovement(content);
    case 'INSTRUCTION':
        return parseInstruction(content);
    case 'SCORE':
        return parseScore(content);
    case 'TITLE':
        return parseTitle(content);
    default:
        // Fallback to current logic for unlabeled lines
        return parseLegacy(line);
}
```

**Estimated Reduction**: ~100-150 lines of classification logic

## Summary

The new prompt would handle these edge cases during extraction:
1. ✅ Abbreviations → AI expands them
2. ✅ Missing amounts → AI infers from context
3. ✅ Dittos → AI expands quotations
4. ✅ Vertical text → AI separates side notes
5. ✅ Line classification → AI pre-labels lines
6. ✅ Ambiguous formats → AI uses domain knowledge

This reduces the need for extensive edge case handling in code while potentially improving accuracy through AI's understanding of CrossFit workout structure.

