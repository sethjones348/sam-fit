# Prompt Comparison and Proposal: Leveraging AI Context for Robust Extraction

## Executive Summary

The current extraction system relies heavily on algorithmic parsing with extensive edge case handling (2000+ lines of parsing logic). The proposed new prompt leverages AI's domain knowledge about CrossFit workouts to handle edge cases during text extraction, potentially reducing the need for explicit edge case handling in code.

## Current Prompt Analysis

### Current Prompt (Lines 258-274, 442-458)

```
Extract all visible text from this whiteboard image.

Return the text exactly as written, preserving original line breaks and order.

For each line:
- Insert vertical pipes (|) between logical text groups (e.g., number | word | number ) on that line.
- Do not merge or split lines.
- Do not infer meaning or reword text.

Rules:
- No explanations
- No comments
- No markdown
- Plain text only
- One output line per original line

Output only the extracted text with pipes added.
```

### Characteristics:
- **Minimal context**: No domain knowledge provided
- **No inference**: Explicitly forbids AI from inferring meaning
- **Passive role**: AI just extracts text, all interpretation happens in code
- **Result**: Requires extensive edge case handling in parsing logic

## Proposed New Prompt

```
Extract all visible text from this image. The image shows a crossfit workout of the day (WOD) or lift written on a whiteboard.

For each line:

- Prefix the line with one label: TITLE, MOVEMENT, INSTRUCTION, or SCORE.

-Insert vertical pipes (|) between logical text groups; amount ( number, distance, time, watts, etc) | movement (common CrossFit exercises) | scale (weight, height, distance). 

-Infer and insert missing or corrected information. Example: "3rvs" = "3 rounds" Example: lines with movement only may use amount from the line above. Example: line with amount only may be applied to lines below with movement only. Example: quotations = ditto of similar lines above.

- Text that is visually off to the side or oriented vertically should be output as its own line.

Label definitions:

- TITLE: workout name or main heading

- MOVEMENT: reps, exercises, weights, units

- INSTRUCTION: notes, rest, repeat, cues, descriptive text

- SCORE: times, rounds, + reps, dates, athlete scores

Rules:

- Choose exactly one label per line.

- No explanations

- No comments

- No markdown

- Plain text only

Output nothing except the labeled, piped text.
```

### Characteristics:
- **Rich context**: Provides domain knowledge (CrossFit WOD/lift)
- **Active inference**: AI handles abbreviations, dittos, missing amounts
- **Semantic labeling**: Pre-categorizes lines (TITLE, MOVEMENT, INSTRUCTION, SCORE)
- **Edge case handling**: AI handles vertical text, dittos, missing context

## Key Differences

| Aspect | Current Prompt | New Prompt |
|--------|---------------|------------|
| **Context** | None | CrossFit domain knowledge |
| **Inference** | Forbidden | Encouraged (abbreviations, dittos, missing amounts) |
| **Labeling** | None | Semantic labels (TITLE, MOVEMENT, INSTRUCTION, SCORE) |
| **Edge Cases** | Handled in code | Handled by AI |
| **AI Role** | Passive OCR | Active interpretation |

## Current Edge Case Handling in Code

The current parsing logic handles many edge cases that the new prompt could handle:

### 1. Abbreviations and Corrections
**Current Code**: No explicit handling - relies on exact text matching
**New Prompt**: Handles "3rvs" → "3 rounds" automatically

### 2. Missing Amounts (Pyramid/Ladder)
**Current Code**: Lines 763-778 - Tracks `pendingAmount` for pyramid/ladder schemes
```typescript
// Check if this is a pyramid/ladder rep scheme on its own line
if (gridLine.length === 1 && firstColumn.match(/^(\d+(?:-\d+)+)$/)) {
    pendingAmount = firstColumn;
    continue; // Skip this line, use the amount for the next movement
}
```
**New Prompt**: AI infers "lines with movement only may use amount from the line above"

### 3. Dittos (Quotation Marks)
**Current Code**: No explicit handling
**New Prompt**: "quotations = ditto of similar lines above"

### 4. Vertical/Side Text
**Current Code**: No explicit handling
**New Prompt**: "Text that is visually off to the side or oriented vertically should be output as its own line"

### 5. Line Classification
**Current Code**: Lines 780-863 - Extensive logic to skip non-movements:
- Section headers
- Scores (with "+", dates, "@" symbols)
- Rest/descriptive elements
- Time-only lines
**New Prompt**: Semantic labels pre-categorize lines, reducing classification logic

### 6. Reversed Formats
**Current Code**: Lines 960-974 - Handles "amount | unit | exercise" vs "amount | exercise | unit"
**New Prompt**: More specific pipe guidance could help AI structure correctly

## Proposal: Hybrid Approach

### Phase 1: Test New Prompt (Low Risk)
1. **Add new prompt as optional flag**: Create `USE_SMART_PROMPT=true` environment variable
2. **Parallel testing**: Run both prompts on test suite and compare results
3. **Metrics to track**:
   - Extraction accuracy
   - Parsing success rate
   - Edge case coverage
   - API cost (if inference increases token usage)

### Phase 2: Leverage Semantic Labels (Medium Risk)
1. **Parse labels from output**: Extract `TITLE:`, `MOVEMENT:`, `INSTRUCTION:`, `SCORE:` prefixes
2. **Simplify parsing logic**: Use labels to route to appropriate parsers
3. **Reduce classification code**: Lines 780-863 could be simplified if AI pre-labels correctly

### Phase 3: Reduce Edge Case Handling (Higher Risk)
1. **Trust AI inference**: Remove code that handles abbreviations, dittos, missing amounts
2. **Monitor accuracy**: Track if AI inference is reliable enough
3. **Keep fallbacks**: Maintain some edge case handling as safety net

## Benefits of New Prompt

### 1. Reduced Code Complexity
- **Current**: ~500 lines of edge case handling in `parseMovements()` alone
- **Potential**: Could reduce to ~200-300 lines with AI pre-processing

### 2. Better Handling of Ambiguous Cases
- AI can use visual context (spatial layout) that code can't access
- AI understands CrossFit terminology and abbreviations
- AI can infer missing information from context

### 3. More Robust to Variations
- Handles handwriting variations better
- Adapts to different whiteboard layouts
- Less brittle to format changes

### 4. Cost Optimization
- **Current**: AI extracts text, code does heavy parsing
- **New**: AI does more work, but potentially reduces failed extractions
- **Trade-off**: Slightly higher token usage vs. better accuracy

## Risks and Mitigations

### Risk 1: AI Hallucination
**Risk**: AI might infer incorrectly (e.g., "3rvs" → "3 rounds" when it should be "3 reverse")
**Mitigation**: 
- Keep validation logic for critical fields
- Use confidence scores
- Fall back to current prompt if accuracy drops

### Risk 2: Inconsistent Labeling
**Risk**: AI might mislabel lines (e.g., MOVEMENT vs SCORE)
**Mitigation**:
- Validate labels against content patterns
- Use labels as hints, not absolute truth
- Keep existing classification logic as fallback

### Risk 3: Increased Token Usage
**Risk**: More inference = more tokens = higher cost
**Mitigation**:
- Measure actual token usage
- Compare cost vs. accuracy improvement
- Optimize prompt if needed

### Risk 4: Breaking Changes
**Risk**: Changing prompt might break existing extractions
**Mitigation**:
- Phase 1: Parallel testing
- Phase 2: Feature flag with fallback
- Phase 3: Gradual rollout

## Implementation Plan

### Step 1: Create Prompt Variant Function
```typescript
function getTextExtractionPrompt(useSmartPrompt: boolean): string {
  if (useSmartPrompt) {
    return `[New prompt text]`;
  }
  return `[Current prompt text]`;
}
```

### Step 2: Update Extraction Functions
- Add `useSmartPrompt` parameter to `extractTextWithGemini()` and `extractTextWithOpenAI()`
- Use environment variable `USE_SMART_PROMPT` to control behavior

### Step 3: Parse Labels from Output
```typescript
function parseLabeledLine(line: string): { label: string; content: string } {
  const match = line.match(/^(TITLE|MOVEMENT|INSTRUCTION|SCORE):\s*(.+)$/);
  if (match) {
    return { label: match[1], content: match[2] };
  }
  return { label: 'UNKNOWN', content: line };
}
```

### Step 4: Update Parsing Logic
- Route lines based on labels
- Simplify classification logic
- Keep fallbacks for unlabeled lines

## Expected Outcomes

### Short Term (Phase 1)
- Better handling of abbreviations ("3rvs" → "3 rounds")
- Better handling of dittos
- More consistent pipe placement

### Medium Term (Phase 2)
- Reduced classification code (~100-200 lines)
- More accurate line categorization
- Better handling of vertical/side text

### Long Term (Phase 3)
- Significant code reduction (~300-400 lines)
- More robust to format variations
- Better accuracy on edge cases

## Testing Strategy

### Test Cases to Validate
1. **Abbreviations**: "3rvs", "E5MOM", "AMRAP"
2. **Dittos**: Lines with quotation marks
3. **Missing amounts**: Pyramid/ladder schemes
4. **Vertical text**: Side notes, annotations
5. **Label accuracy**: Correct TITLE/MOVEMENT/INSTRUCTION/SCORE classification
6. **Edge cases**: All existing test cases should still pass

### Success Criteria
- **Accuracy**: ≥95% of test cases pass with new prompt
- **Code reduction**: ≥20% reduction in parsing logic
- **Cost**: Token usage increase <30%
- **Performance**: No significant latency increase

## Conclusion

The new prompt leverages AI's domain knowledge and inference capabilities to handle edge cases that currently require extensive code. This approach:

1. **Reduces code complexity** by moving edge case handling to AI
2. **Improves robustness** by leveraging AI's understanding of CrossFit terminology
3. **Maintains testability** by keeping algorithmic parsing for structure

The hybrid approach (AI inference + algorithmic parsing) balances the benefits of both worlds: AI's flexibility for edge cases and code's determinism for structure.

## Next Steps

1. **Review this proposal** with team
2. **Implement Phase 1** (parallel testing)
3. **Measure results** and decide on Phase 2
4. **Iterate** based on findings

