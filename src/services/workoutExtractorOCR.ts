/**
 * Hybrid Extraction: Gemini Text Extraction + Algorithmic Parsing
 * 
 * This approach uses Gemini AI ONLY for text extraction (OCR-like functionality),
 * then applies deterministic algorithmic parsing to structure the data.
 * 
 * Benefits:
 * - Gemini's superior text recognition (handles handwriting, poor quality, etc.)
 * - Algorithmic parsing (testable, deterministic, no AI hallucinations)
 * - Best of both worlds: accuracy + testability
 * 
 * This service is parallel to workoutExtractor.ts (full Gemini extraction) and can be
 * tested against the same test data for comparison.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';
import { WorkoutExtraction, WorkoutElement, ScoreElement, ScoreName } from '../types';
import { parseTimeToSeconds, formatSecondsToTime } from '../utils/timeUtils';
import { normalizeMovementName } from '../utils/movementNormalizer';

interface OCRData {
    text: string;
    words: Array<{
        text: string;
        confidence: number;
    }>;
    lines: string[]; // Just the text lines - we use grid structure for parsing, not spatial positions
}

// Removed LayoutAnalysis - we parse all lines and let parsers filter themselves

/**
 * Grid structure: array of arrays of strings
 * Each line is parsed into columns, preserving empty fields
 * Example: "30 | Double Unders |" -> ["30", "Double Unders", ""]
 */
type GridLine = string[];

/**
 * Parse a line into a grid structure (array of strings)
 * Preserves empty fields to maintain column alignment
 */
function parseLineToGrid(line: string): GridLine | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Split by pipe, trim each part, and filter out empty entries
    const parts = trimmed.split('|').map(p => p.trim()).filter(p => p.length > 0);

    // Return null if all parts were empty (just pipes)
    if (parts.length === 0) return null;

    // Return the parts as grid
    return parts;
}

/**
 * Check if a grid line matches expected column count
 */
function validateGridColumns(line: GridLine, expectedCount: number, minCount?: number): boolean {
    if (minCount !== undefined) {
        return line.length >= minCount;
    }
    return line.length === expectedCount;
}

/**
 * Get a column value from grid line, with fallback
 */
function getGridColumn(line: GridLine, index: number, fallback: string = ''): string {
    return index < line.length ? line[index] : fallback;
}

/**
 * Convert HEIC image to PNG (for better compatibility with Gemini)
 */
async function convertHeicToPngBuffer(heicBuffer: Buffer): Promise<Buffer> {
    // Create temporary files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempHeicPath = path.join(tempDir, `temp_${Date.now()}.heic`);
    const tempPngPath = path.join(tempDir, `temp_${Date.now()}.png`);

    try {
        // Write HEIC buffer to temp file
        fs.writeFileSync(tempHeicPath, heicBuffer);

        // Try using macOS sips command first (most reliable for HEIC on macOS)
        try {
            execSync(`sips -s format png "${tempHeicPath}" --out "${tempPngPath}"`, {
                stdio: ['ignore', 'pipe', 'pipe'],
                encoding: 'utf8',
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
            });

            // Wait a bit for file system to sync
            await new Promise(resolve => setTimeout(resolve, 100));

            if (fs.existsSync(tempPngPath)) {
                const stats = fs.statSync(tempPngPath);
                if (stats.size > 0) {
                    // Use sharp to auto-rotate based on EXIF data
                    try {
                        const rotatedBuffer = await sharp(tempPngPath)
                            .rotate() // Auto-rotate based on EXIF orientation
                            .png()
                            .toBuffer();

                        // Clean up
                        if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
                        if (fs.existsSync(tempHeicPath)) fs.unlinkSync(tempHeicPath);

                        return Buffer.from(rotatedBuffer);
                    } catch (rotateError) {
                        // If rotation fails, just read the sips output
                        const buffer = fs.readFileSync(tempPngPath);
                        if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
                        if (fs.existsSync(tempHeicPath)) fs.unlinkSync(tempHeicPath);
                        return buffer;
                    }
                }
            }
        } catch (sipsError) {
            // sips not available or failed, try sharp
            try {
                const buffer = await sharp(tempHeicPath)
                    .rotate()
                    .png()
                    .toBuffer();

                if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
                if (fs.existsSync(tempHeicPath)) fs.unlinkSync(tempHeicPath);

                return buffer;
            } catch (sharpError) {
                throw new Error(
                    `Failed to convert HEIC image. ` +
                    `sips error: ${sipsError instanceof Error ? sipsError.message : String(sipsError)}. ` +
                    `sharp error: ${sharpError instanceof Error ? sharpError.message : String(sharpError)}. ` +
                    `Note: HEIC conversion requires macOS sips or libheif for sharp.`
                );
            }
        }
    } finally {
        // Clean up temp files
        try {
            if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
            if (fs.existsSync(tempHeicPath)) fs.unlinkSync(tempHeicPath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    throw new Error('HEIC conversion failed - no output buffer created');
}

/**
 * Extract text from image using either OpenAI or Gemini (text extraction only)
 * 
 * Uses OpenAI GPT-4o-mini if USE_OPENAI=true, otherwise uses Gemini.
 * Extracts raw text from the whiteboard, preserving line structure and layout.
 * No interpretation or structuring - just text.
 */
async function extractTextWithGemini(imageBase64: string): Promise<OCRData> {
    // Check which provider to use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const useOpenAI = process.env.USE_OPENAI === 'true' || (typeof window !== 'undefined' && (globalThis as any).import?.meta?.env?.USE_OPENAI === 'true');

    if (useOpenAI) {
        return extractTextWithOpenAI(imageBase64);
    } else {
        return extractTextWithGeminiAPI(imageBase64);
    }
}

/**
 * Extract text using OpenAI GPT-4o-mini
 */
async function extractTextWithOpenAI(imageBase64: string): Promise<OCRData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || (typeof window !== 'undefined' && (globalThis as any).import?.meta?.env?.VITE_OPENAI_API_KEY ? (globalThis as any).import.meta.env.VITE_OPENAI_API_KEY : null);

    if (!OPENAI_API_KEY) {
        throw new Error('VITE_OPENAI_API_KEY is required when USE_OPENAI=true');
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // Remove data URL prefix if present
    let base64Data = imageBase64;
    let mimeType = 'image/png';

    if (imageBase64.includes(',')) {
        const [header, data] = imageBase64.split(',');
        base64Data = data;

        // Extract MIME type from data URL
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
            mimeType = mimeMatch[1];
        }
    }

    let imageBuffer: Buffer = Buffer.from(base64Data, 'base64');
    const originalSize = imageBuffer.length;
    console.log(`  [Image Processing] Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

    // Convert HEIC to PNG if needed (Gemini supports HEIC but PNG is more reliable)
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
        const conversionStartTime = Date.now();
        console.log(`  [Image Conversion] Converting HEIC to PNG...`);
        const convertedBuffer = await convertHeicToPngBuffer(imageBuffer);
        imageBuffer = Buffer.from(convertedBuffer);
        mimeType = 'image/png';
        const conversionTime = Date.now() - conversionStartTime;
        console.log(`  [Image Conversion] ✓ Converted (${(conversionTime / 1000).toFixed(2)}s, size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Compress and resize image before sending to Gemini to reduce API call time
    // Whiteboard text doesn't need high resolution - 1920px width is plenty
    const compressionStartTime = Date.now();
    console.log(`  [Image Compression] Compressing and resizing...`);
    try {
        const compressedBuffer = await sharp(imageBuffer)
            .resize(1920, null, {
                withoutEnlargement: true, // Don't upscale small images
                fit: 'inside' // Maintain aspect ratio
            })
            .jpeg({
                quality: 85, // Good balance of quality and size
                mozjpeg: true // Better compression
            })
            .toBuffer();

        const compressionRatio = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);
        imageBuffer = compressedBuffer;
        mimeType = 'image/jpeg';
        const compressionTime = Date.now() - compressionStartTime;
        console.log(`  [Image Compression] ✓ Compressed (${(compressionTime / 1000).toFixed(2)}s, ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB, ${compressionRatio}% reduction)`);
    } catch (compressionError) {
        // If compression fails (e.g., unsupported format), log and continue with original
        console.log(`  [Image Compression] ⚠ Compression failed, using original (${((compressionError as Error).message).substring(0, 50)})`);
    }

    // Prompt for text extraction with pipe delimiters for easier parsing
    const TEXT_EXTRACTION_PROMPT = `Extract all visible text from this whiteboard image.

Return the text exactly as written, preserving original line breaks and order.

For each line:
- Insert vertical pipes (|) between logical text groups on that line.
- Do not merge or split lines.
- Do not infer meaning or reword text.

Rules:
- No explanations
- No comments
- No markdown
- Plain text only
- One output line per original line

Output only the extracted text with pipes added.`;

    // Use GPT-4o-mini for text extraction
    const modelName = 'gpt-4o-mini';
    let rawText: string | null = null;
    let apiCallStartTime: number | null = null;
    let totalRetries = 0;

    console.log(`  [Text Extraction] Starting extraction with ${modelName}...`);

    // Retry logic for rate limits and errors
    let retries = 3;
    while (retries > 0) {
        try {
            apiCallStartTime = Date.now();
            console.log(`  [Text Extraction] Calling ${modelName}...`);

            const response = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: TEXT_EXTRACTION_PROMPT,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 2000, // Should be enough for whiteboard text
            });

            rawText = response.choices[0]?.message?.content || null;

            if (!rawText) {
                throw new Error('No text content in response');
            }

            const apiCallTime = Date.now() - (apiCallStartTime || 0);
            console.log(`  [Text Extraction] ✓ Success with ${modelName} (API call: ${(apiCallTime / 1000).toFixed(2)}s, retries: ${3 - retries})`);
            break; // Success, exit retry loop
        } catch (retryError: any) {
            const error = retryError instanceof Error ? retryError : new Error(String(retryError));

            // Check if it's a rate limit error
            const isRateLimitError =
                error.message?.includes('rate_limit') ||
                error.message?.includes('429') ||
                retryError?.status === 429;

            // Check if it's a server error (500, 502, 503)
            const isServerError =
                error.message?.includes('500') ||
                error.message?.includes('502') ||
                error.message?.includes('503') ||
                error.message?.includes('overloaded') ||
                error.message?.includes('Service Unavailable') ||
                (retryError?.status && retryError.status >= 500);

            if ((isRateLimitError || isServerError) && retries > 1) {
                const waitTime = Math.pow(2, 3 - retries) * 1000;
                totalRetries++;
                console.log(`  [Text Extraction] ⚠ ${isRateLimitError ? 'Rate limit' : 'Server'} error, retrying in ${(waitTime / 1000).toFixed(1)}s... (${retries - 1} retries left)`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries--;
                continue;
            }

            // For other errors, throw immediately
            console.error(`  [Text Extraction] ✗ ${modelName} failed: ${error.message}`);
            throw error;
        }
    }

    if (!rawText) {
        console.error(`  [Text Extraction] ✗ All retries exhausted after ${totalRetries} retries`);
        throw new Error(
            `Failed to extract text with ${modelName} after ${totalRetries} retries. ` +
            `Please check your API key and try again.`
        );
    }

    console.log(`  [Text Extraction] Final model used: ${modelName}, total retries: ${totalRetries}`);

    return processExtractedText(rawText);
}

/**
 * Extract text using Gemini API
 */
async function extractTextWithGeminiAPI(imageBase64: string): Promise<OCRData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' && (globalThis as any).import?.meta?.env?.VITE_GEMINI_API_KEY ? (globalThis as any).import.meta.env.VITE_GEMINI_API_KEY : null);

    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is required for text extraction');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Remove data URL prefix if present
    let base64Data = imageBase64;
    let mimeType = 'image/png';

    if (imageBase64.includes(',')) {
        const [header, data] = imageBase64.split(',');
        base64Data = data;

        // Extract MIME type from data URL
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
            mimeType = mimeMatch[1];
        }
    }

    let imageBuffer: Buffer = Buffer.from(base64Data, 'base64');
    const originalSize = imageBuffer.length;
    console.log(`  [Image Processing] Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

    // Convert HEIC to PNG if needed (Gemini supports HEIC but PNG is more reliable)
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
        const conversionStartTime = Date.now();
        console.log(`  [Image Conversion] Converting HEIC to PNG...`);
        const convertedBuffer = await convertHeicToPngBuffer(imageBuffer);
        imageBuffer = Buffer.from(convertedBuffer);
        mimeType = 'image/png';
        const conversionTime = Date.now() - conversionStartTime;
        console.log(`  [Image Conversion] ✓ Converted (${(conversionTime / 1000).toFixed(2)}s, size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Compress and resize image before sending to Gemini to reduce API call time
    // Whiteboard text doesn't need high resolution - 1920px width is plenty
    const compressionStartTime = Date.now();
    console.log(`  [Image Compression] Compressing and resizing...`);
    try {
        const compressedBuffer = await sharp(imageBuffer)
            .resize(1920, null, {
                withoutEnlargement: true, // Don't upscale small images
                fit: 'inside' // Maintain aspect ratio
            })
            .jpeg({
                quality: 85, // Good balance of quality and size
                mozjpeg: true // Better compression
            })
            .toBuffer();

        const compressionRatio = ((1 - compressedBuffer.length / imageBuffer.length) * 100).toFixed(1);
        imageBuffer = compressedBuffer;
        mimeType = 'image/jpeg';
        const compressionTime = Date.now() - compressionStartTime;
        console.log(`  [Image Compression] ✓ Compressed (${(compressionTime / 1000).toFixed(2)}s, ${(compressedBuffer.length / 1024 / 1024).toFixed(2)}MB, ${compressionRatio}% reduction)`);
    } catch (compressionError) {
        // If compression fails (e.g., unsupported format), log and continue with original
        console.log(`  [Image Compression] ⚠ Compression failed, using original (${((compressionError as Error).message).substring(0, 50)})`);
    }

    // Prompt for text extraction with pipe delimiters for easier parsing
    const TEXT_EXTRACTION_PROMPT = `Extract all visible text from this whiteboard image.

Return the text exactly as written, preserving original line breaks and order.

For each line:
- Insert vertical pipes (|) between logical text groups on that line.
- If a group is missing, still include the pipe.
- Do not merge or split lines.
- Do not infer meaning or reword text.

Rules:
- No explanations
- No comments
- No markdown
- Plain text only
- One output line per original line

Output only the extracted text with pipes added.`;

    // Try different model names with fallback
    const modelNames = [
        'gemini-1.5-flash',     // Fast, supports vision (recommended)
        'gemini-1.5-pro',       // More capable, supports vision
        'gemini-1.5-flash-8b',  // Smaller, faster variant
        'gemini-pro',           // Legacy fallback
    ];

    // Try to get available models
    let availableModels: string[] = [];
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiKey = process.env.VITE_GEMINI_API_KEY || (typeof window !== 'undefined' && (globalThis as any).import?.meta?.env?.VITE_GEMINI_API_KEY ? (globalThis as any).import.meta.env.VITE_GEMINI_API_KEY : null);
        if (apiKey) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
            );
            const data = await response.json();
            if (data.models) {
                availableModels = data.models.map((m: { name: string }) => m.name.replace('models/', ''));
            }
        }
    } catch (error) {
        // Ignore - will use fallback list
    }

    if (availableModels.length > 0) {
        // Add available models to the list to try
        modelNames.unshift(...availableModels.filter(m => m.includes('gemini')));
    }

    let lastError: Error | null = null;
    let rawText: string | null = null;
    let usedModel: string | null = null;
    let apiCallStartTime: number | null = null;
    let totalRetries = 0;

    console.log(`  [Text Extraction] Starting extraction with ${modelNames.length} model(s) to try...`);

    for (const modelName of modelNames) {
        try {
            console.log(`  [Text Extraction] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Retry logic for 503 errors
            let retries = 3;
            let result;
            while (retries > 0) {
                try {
                    apiCallStartTime = Date.now();
                    result = await model.generateContent([
                        {
                            inlineData: {
                                data: imageBuffer.toString('base64'),
                                mimeType: mimeType,
                            },
                        },
                        { text: TEXT_EXTRACTION_PROMPT },
                    ]);
                    const apiCallTime = Date.now() - (apiCallStartTime || 0);
                    console.log(`  [Text Extraction] ✓ Success with ${modelName} (API call: ${(apiCallTime / 1000).toFixed(2)}s, retries: ${3 - retries})`);
                    break; // Success, exit retry loop
                } catch (retryError: any) {
                    const is503Error =
                        retryError?.message?.includes('503') ||
                        retryError?.message?.includes('overloaded') ||
                        retryError?.message?.includes('Service Unavailable');

                    if (is503Error && retries > 1) {
                        const waitTime = Math.pow(2, 3 - retries) * 1000;
                        totalRetries++;
                        console.log(`  [Text Extraction] ⚠ 503 error, retrying in ${(waitTime / 1000).toFixed(1)}s... (${retries - 1} retries left)`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        retries--;
                        continue;
                    }
                    throw retryError; // Not a 503 or out of retries, throw error
                }
            }

            if (!result) {
                throw new Error('Failed to generate content after retries');
            }

            rawText = result.response.text();
            usedModel = modelName;
            break; // Success, exit model loop
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            lastError = error;

            // Check if it's a 404 (model not found) - try next model
            if (error.message.includes('404') || error.message.includes('not found')) {
                console.log(`  [Text Extraction] ✗ Model ${modelName} not found (404), trying next model...`);
                continue; // Try next model
            }

            // Check if it's a 503 (service overloaded) - try next model
            const is503Error =
                error.message.includes('503') ||
                error.message.includes('overloaded') ||
                error.message.includes('Service Unavailable');

            if (is503Error) {
                console.log(`  [Text Extraction] ✗ Model ${modelName} overloaded (503), trying next model...`);
                continue; // Try next model
            }

            console.log(`  [Text Extraction] ✗ Model ${modelName} failed: ${error.message}`);
            // For other errors, rethrow
            throw error;
        }
    }

    if (!rawText) {
        // If we get here, all models failed
        const availableModelsList = availableModels.length > 0
            ? `\nAvailable models from API: ${availableModels.join(', ')}`
            : '\nCould not fetch available models list.';

        console.error(`  [Text Extraction] ✗ All models failed after ${totalRetries} retries`);
        throw new Error(
            `No available Gemini model found. Tried: ${modelNames.join(', ')}. ` +
            `Last error: ${lastError?.message || 'Unknown error'}. ` +
            `${availableModelsList} ` +
            `Please check your API key has access to Gemini models and is valid.`
        );
    }

    console.log(`  [Text Extraction] Final model used: ${usedModel}, total retries: ${totalRetries}`);

    return processExtractedText(rawText);
}

/**
 * Process extracted text into OCRData structure
 */
function processExtractedText(rawText: string): OCRData {
    try {
        // Clean up pipe placement before parsing
        const cleanedText = cleanGeminiPipeOutput(rawText);

        // Parse the text into lines
        const textLines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Create OCRData structure from extracted text
        // We only need text lines and word confidence - grid structure handles parsing
        const words: OCRData['words'] = textLines
            .flatMap(lineText => lineText.split(/\s+/))
            .map(word => ({
                text: word,
                confidence: 0.95, // High confidence since AI extracted it
            }));

        return {
            text: textLines.join('\n'),
            words,
            lines: textLines, // Just the text lines
        };
    } catch (error) {
        // This catch block is for parsing errors after successful text extraction
        throw new Error(`Failed to parse extracted text: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Clean up Gemini's pipe output
 * Removes consecutive pipes, trailing/leading pipes, and normalizes spacing
 * Examples:
 * - "AMRAP | | 10 min" → "AMRAP | 10 min"
 * - "30 | DU |" → "30 | DU"
 * - "25:55 | | | 11/9/25" → "25:55 | 11/9/25"
 */
function cleanGeminiPipeOutput(rawText: string): string {
    return rawText
        .split('\n')
        .map(line => {
            // Normalize spacing around pipes first ( | | → |)
            line = line.replace(/\s*\|\s*/g, '|');

            // Remove consecutive pipes (|| → |)
            // This handles cases like "AMRAP || 10 min" → "AMRAP | 10 min"
            line = line.replace(/\|+/g, '|');

            // Split by pipe, trim each part, filter empty, then rejoin
            // This ensures clean pipe-delimited format
            const parts = line.split('|').map(part => part.trim()).filter(part => part.length > 0);

            // Rejoin with normalized spacing (single space around pipe)
            line = parts.join(' | ');

            // Remove leading/trailing pipes if they exist
            line = line.replace(/^\|\s*/, '').replace(/\s*\|$/, '');

            // Remove multiple spaces (but preserve space around pipes)
            line = line.replace(/\s+/g, ' ');

            return line.trim();
        })
        .join('\n');
}

/**
 * Grid structure: array of grid lines, where each line is an array of strings (columns)
 */
type GridData = GridLine[];

/**
 * Build full grid structure from all lines
 * Each line is converted to a grid (array of strings between pipes)
 */
function buildGrid(allLines: string[]): GridData {
    return allLines
        .map(line => parseLineToGrid(line))
        .filter((grid): grid is GridLine => grid !== null);
}

/**
 * Get all lines from OCR data
 * We no longer try to guess regions - let parsers filter themselves
 */
function getAllLines(ocrData: OCRData): string[] {
    return ocrData.lines
        .map(line => line.trim())
        .filter(text => text.length > 0);
}

/**
 * Parse workout title from the first grid line
 * Also extracts metadata like time cap, EMOM period, sets info
 */
function parseTitle(grid: GridData): { title: string; timeCap?: number; emomPeriod?: number; setsInfo?: { sets: number; rounds: number } } {
    // Title is always the first grid line - join all columns with spaces
    const titleLine = grid[0]?.join(' ') || 'Workout';

    // Clean title: remove pipes and extra whitespace, fix encoding issues
    let title = titleLine
        .replace(/\|/g, ' ')  // Remove pipes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    // Fix common encoding issues
    title = title.replace(/£/g, 'E'); // "£5 MOM" → "E5 MOM"

    // If title is just whitespace or very short after cleaning, use fallback
    if (!title || title.length < 2) {
        title = 'Workout';
    }
    const titleLower = title.toLowerCase();
    const result: { title: string; timeCap?: number; emomPeriod?: number; setsInfo?: { sets: number; rounds: number } } = { title: title || 'Workout' };

    // Extract time cap (e.g., "10 min AMRAP - 15 min cap" or "15 min cap")
    const timeCapMatch = titleLower.match(/(\d+)\s*(?:min|minute|m)\s*(?:cap|time\s*cap)/i);
    if (timeCapMatch) {
        result.timeCap = parseInt(timeCapMatch[1], 10) * 60; // Convert to seconds
    }

    // Extract EMOM period (e.g., "E5MOM" = 5, "5 min EMOM" = 5)
    const emomPeriodMatch = title.match(/E(\d+)MOM/i) || titleLower.match(/(\d+)\s*(?:min|minute|m)\s*emom/i);
    if (emomPeriodMatch) {
        result.emomPeriod = parseInt(emomPeriodMatch[1], 10);
    } else if (titleLower.includes('emom') && !result.emomPeriod) {
        // Default to 1 minute if EMOM but no period specified
        result.emomPeriod = 1;
    }

    // Extract sets info (e.g., "2 sets, 3 rds" or "2 sets 3 rounds")
    const setsMatch = titleLower.match(/(\d+)\s*sets?\s*,?\s*(\d+)\s*(?:rds?|rounds?)/i);
    if (setsMatch) {
        result.setsInfo = {
            sets: parseInt(setsMatch[1], 10),
            rounds: parseInt(setsMatch[2], 10),
        };
    }

    // If title is just a code (like "E5MOM"), we'll infer a better title later
    if (title.match(/^E\d+MOM$/i) || title.match(/^(AMRAP|EMOM|CHIPPER)$/i)) {
        result.title = title; // Will be improved during type detection
    }

    return result;
}

/**
 * Parse movements from grid data
 * Skips the first line (title)
 */
function parseMovements(grid: GridData): WorkoutElement[] {
    const elements: WorkoutElement[] = [];

    // Skip the first line (title) when parsing movements
    const movementGrids = grid.slice(1);

    for (const gridLine of movementGrids) {
        if (!gridLine || gridLine.length === 0) continue;

        const firstColumn = getGridColumn(gridLine, 0);
        // Join non-empty columns with spaces (pipes are just delimiters, not part of the content)
        const trimmed = gridLine.filter(col => col && col.trim().length > 0).join(' ');

        // Skip lines that are clearly not movements (like section headers)
        // But don't skip "rest" here - we'll handle it as a descriptive element below
        if (firstColumn.match(/^(workout|score|rounds?|sets?|time|reps?)$/i)) {
            continue;
        }

        // Skip lines that look like scores (contain "+" with numbers, dates, etc.)
        // Patterns like "8 + 25", "3 rounds + 15 reps", "11/16/25" (dates)
        // Also handle grid format: "5 | + | 12"
        if (trimmed.match(/\d+\s*\+\s*\d+/) ||
            (gridLine.length >= 3 && getGridColumn(gridLine, 1) === '+' &&
                !isNaN(parseInt(getGridColumn(gridLine, 0), 10)) &&
                !isNaN(parseInt(getGridColumn(gridLine, 2), 10)))) {
            // Has "number + number" pattern - likely a score, not a movement
            continue;
        }
        if (trimmed.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
            // Has date pattern (MM/DD/YY or MM/DD/YYYY) - likely metadata, not a movement
            continue;
        }
        if (trimmed.match(/rounds?\s*\+\s*\d+\s*reps?/i)) {
            // Has "rounds + reps" pattern - definitely a score
            continue;
        }

        // Check for rest/descriptive elements FIRST (before grid parsing)
        // This prevents "rest | 1:00 |" from being parsed as movement or score
        // Also handles "@ | 8:00 |" as a descriptive element
        const restMatch = trimmed.match(/^(rest|repeat|then|and)\s*(.*)/i);
        if (restMatch) {
            const [, keyword] = restMatch;
            // Try to extract duration from grid format (e.g., "Rest | | 1:00")
            let duration = parseRestDuration(trimmed);
            if (!duration && gridLine.length >= 3) {
                // Check grid columns for time (e.g., col2 might have "1:00")
                const timeCol = getGridColumn(gridLine, 2) || getGridColumn(gridLine, 1);
                if (timeCol) {
                    duration = parseRestDuration(`rest ${timeCol}`);
                }
            }
            // Create clean text without pipes - join non-empty columns with spaces
            const cleanTextParts = gridLine.filter(col => col && col.trim().length > 0);
            const cleanText = cleanTextParts.join(' ');

            elements.push({
                type: 'descriptive',
                descriptive: {
                    text: cleanText,
                    type: keyword.toLowerCase() === 'rest' ? 'rest' :
                        keyword.toLowerCase() === 'repeat' ? 'repeat' :
                            keyword.toLowerCase() === 'then' || keyword.toLowerCase() === 'and' ? 'instruction' : null,
                    duration: duration || undefined,
                },
            });
            continue;
        }

        // Check for "@" symbol as descriptive element (e.g., "@ | 8:00 |")
        if (firstColumn === '@' || trimmed.match(/^@\s*\|/)) {
            // Extract time if present
            const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
            const duration = timeMatch ? parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10) : undefined;
            elements.push({
                type: 'descriptive',
                descriptive: {
                    text: trimmed,
                    type: 'instruction',
                    duration: duration,
                },
            });
            continue;
        }

        // Skip time-only lines (e.g., "1:38 |", "2:22 |") - these are scores, not movements
        if (gridLine.length === 1 || (gridLine.length === 2 && getGridColumn(gridLine, 1).trim() === '')) {
            const timeOnlyMatch = firstColumn.match(/^(\d{1,2}):(\d{2})$/);
            if (timeOnlyMatch) {
                continue; // This is a score line, not a movement
            }
        }

        // Parse grid format: amount | exercise | unit
        if (gridLine.length >= 2) {
            const amount = getGridColumn(gridLine, 0);
            const exercise = getGridColumn(gridLine, 1);
            const unit = getGridColumn(gridLine, 2);

            // Skip if exercise is empty (e.g., "10 | |")
            if (!exercise || exercise.trim().length === 0) {
                continue;
            }

            // Validate amount format
            // Supports: "21", "2-4-6-8", "10-20-30-20-10", "5x5", "5 x 5"
            if (amount.match(/^(\d+(?:-\d+)*|(?:\d+x\d+)|(?:\d+\s*x\s*\d+))$/)) {
                // Check for descriptive elements in grid format
                const keyword = amount.toLowerCase();
                if (keyword.match(/^(rest|repeat|then|and)$/)) {
                    // Create clean text from grid columns
                    const cleanTextParts = gridLine.filter(col => col && col.trim().length > 0);
                    const cleanText = cleanTextParts.join(' ');
                    const duration = parseRestDuration(cleanText);
                    elements.push({
                        type: 'descriptive',
                        descriptive: {
                            text: cleanText,
                            type: keyword === 'rest' ? 'rest' :
                                keyword === 'repeat' ? 'repeat' :
                                    keyword === 'then' || keyword === 'and' ? 'instruction' : null,
                            duration: duration || undefined,
                        },
                    });
                    continue;
                }

                // It's a movement - ensure exercise is not empty and doesn't contain pipes
                if (exercise && exercise.trim().length > 0 && !exercise.includes('|')) {
                    const normalized = normalizeMovementName(exercise);
                    elements.push({
                        type: 'movement',
                        movement: {
                            amount: amount.trim(),
                            exercise: normalized.normalized,
                            unit: unit || null,
                        },
                    });
                    continue;
                }
            }
        }

        // Legacy format (no pipes or invalid grid) - use regex patterns as fallback
        // Check for descriptive elements first
        const descriptiveMatch = trimmed.match(/^(rest|repeat|then|and)\s*(.*)/i);
        if (descriptiveMatch) {
            const [, keyword] = descriptiveMatch;
            const duration = parseRestDuration(trimmed);
            elements.push({
                type: 'descriptive',
                descriptive: {
                    text: trimmed,
                    type: keyword.toLowerCase() === 'rest' ? 'rest' :
                        keyword.toLowerCase() === 'repeat' ? 'repeat' :
                            keyword.toLowerCase() === 'then' || keyword.toLowerCase() === 'and' ? 'instruction' : null,
                    duration: duration || undefined,
                },
            });
            continue;
        }

        // Pattern for movement: amount exercise unit (legacy format)
        const movementPatterns = [
            // Pattern 1: amount exercise unit (e.g., "21 Hang Power Clean 135")
            /^(\d+(?:-\d+)*|(?:\d+x\d+)|(?:\d+\s*x\s*\d+))\s+(.+?)\s+(\d+|lbs|kg|cal|m|ft|in|meters?|feet?)$/i,
            // Pattern 2: amount exercise (e.g., "50 Double Unders")
            /^(\d+(?:-\d+)*|(?:\d+x\d+)|(?:\d+\s*x\s*\d+))\s+(.+)$/i,
        ];

        let matched = false;
        for (const pattern of movementPatterns) {
            const movementMatch = trimmed.match(pattern);
            if (movementMatch) {
                const [, amount, exercise, unit] = movementMatch;

                // Clean up exercise name (remove trailing numbers that might be units)
                let exerciseName = exercise.trim();
                let unitValue: string | null = unit ? unit.trim() : null;

                // If no unit in match but exercise ends with unit-like text, extract it
                if (!unitValue) {
                    const unitMatch = exerciseName.match(/\s+(\d+|lbs|kg|cal|m|ft|in|meters?|feet?)$/i);
                    if (unitMatch) {
                        unitValue = unitMatch[1];
                        exerciseName = exerciseName.replace(/\s+(\d+|lbs|kg|cal|m|ft|in|meters?|feet?)$/i, '').trim();
                    }
                }

                const normalized = normalizeMovementName(exerciseName);

                elements.push({
                    type: 'movement',
                    movement: {
                        amount: amount.trim(),
                        exercise: normalized.normalized,
                        unit: unitValue,
                    },
                });
                matched = true;
                break;
            }
        }

        // If no pattern matched, try to extract as movement without amount (fallback)
        if (!matched && trimmed.length > 3) {
            // Might be just an exercise name (rare, but handle it)
            const normalized = normalizeMovementName(trimmed);
            elements.push({
                type: 'movement',
                movement: {
                    amount: '1',
                    exercise: normalized.normalized,
                    unit: null,
                },
            });
        }
    }

    return elements;
}

/**
 * Parse rest duration from descriptive text
 */
function parseRestDuration(text: string): number | null {
    // "Rest 3:00" = 180 seconds
    // Also handle grid format: "Rest | 1:00" or "Rest | | 1:00"
    const timeMatch = text.match(/(?:rest\s+|\|\s*)(\d+):(\d+)/i);
    if (timeMatch) {
        const minutes = parseInt(timeMatch[1], 10);
        const seconds = parseInt(timeMatch[2], 10);
        return minutes * 60 + seconds;
    }

    // "Rest 1:1" = 60 seconds (work:rest ratio, assume 1 minute)
    const ratioMatch = text.match(/rest\s+1:1/i);
    if (ratioMatch) {
        return 60;
    }

    return null;
}

/**
 * Parse scores from grid data
 * Skips the first line (title)
 * @param grid - Grid data structure
 * @param timeCap - Optional time cap in seconds (if workout has time cap)
 */
function parseScores(grid: GridData, timeCap?: number): ScoreElement[] {
    const scores: ScoreElement[] = [];
    let roundIndex = 0;
    let setIndex = 0;

    // Skip the first line (title) when parsing scores
    const scoreGrids = grid.slice(1);

    for (const gridLine of scoreGrids) {
        if (!gridLine || gridLine.length === 0) continue;

        // Join non-empty columns with spaces (pipes are just delimiters, not part of the content)
        const trimmed = gridLine.filter(col => col && col.trim().length > 0).join(' ');

        // Skip headers
        if (trimmed.match(/^(score|results?|time|reps?|rounds?)\s*\|?$/i)) {
            continue;
        }

        // Skip rest/descriptive elements (they should be in workout, not scores)
        if (trimmed.match(/^(rest|repeat|then|and)\s*(.*)/i)) {
            continue;
        }

        // Skip "@" symbol lines (descriptive elements, e.g., "@ | 8:00 |")
        const firstColumn = getGridColumn(gridLine, 0);
        if (firstColumn === '@' || trimmed.match(/^@\s*\|/)) {
            continue; // This is a descriptive element, not a score
        }

        // Skip lines that look like movements (have exercise names, not scores)
        if (gridLine.length >= 2) {
            const col0 = getGridColumn(gridLine, 0);
            const col1 = getGridColumn(gridLine, 1);

            // Skip if first column is a number (with or without letters like "200W") and second column looks like an exercise
            // (e.g., "30 | DU", "20 | WB", "200W | Bike erg")
            if (col0.match(/^\d+[a-zA-Z]*$/) && col1 &&
                !col1.match(/^\d+$/) &&
                col1 !== '+' &&
                !col1.match(/^\d{1,2}:\d{2}$/) &&
                !col1.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/) && // Not a date
                col1.length > 1 &&
                !col1.match(/^(cal|lbs|kg|min|sec)$/i)) {
                // Likely a movement line (amount | exercise), not a score
                continue;
            }
        }

        // Check for round/set labels first (e.g., "Round 1:", "Set 1:" or "Round | 1 |")
        const roundLabelMatch = trimmed.match(/^(round|set)\s+(\d+):?\s*(.*)/i) ||
            trimmed.match(/^(round|set)\s*\|\s*(\d+)\s*\|\s*(.*)/i);
        let workingGrid = gridLine;
        if (roundLabelMatch) {
            const [, type, num, rest] = roundLabelMatch;
            const isSet = type.toLowerCase() === 'set';
            const index = parseInt(num, 10);

            if (isSet) {
                setIndex = index;
                roundIndex = 0; // Reset round index for new set
            } else {
                roundIndex = index;
            }

            // Parse the rest of the line into a grid
            if (rest && rest.trim()) {
                const restGrid = parseLineToGrid(rest.trim());
                if (restGrid && restGrid.length > 0) {
                    workingGrid = restGrid;
                } else {
                    continue; // Just a label, move to next line
                }
            } else {
                continue; // Just a label, move to next line
            }
        }

        // Parse grid format
        if (workingGrid.length > 0) {
            const col0 = getGridColumn(workingGrid, 0);
            const col1 = getGridColumn(workingGrid, 1);
            const col2 = getGridColumn(workingGrid, 2);

            // Time format: "4:06 |" or "4 | 06 |" or "25:55 | | | 11/9/25"
            // Strip date from col0 if present before parsing time
            let timeStr = col0;
            // Remove date patterns from time string
            timeStr = timeStr.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '').trim();

            // Parse as time if it matches time format, UNLESS it has letters attached (like "200W")
            // Skip if it contains letters attached to numbers (like "200W", "30lbs", etc.)
            const hasAttachedLetters = /^\d+[a-zA-Z]/.test(timeStr) || /[a-zA-Z]\d+$/.test(timeStr);

            if (!hasAttachedLetters) {
                const timeMatch = timeStr.match(/(\d{1,2}):?(\d{2})/);
                if (timeMatch) {
                    const timeInSeconds = parseTimeToSeconds(timeStr);
                    if (timeInSeconds !== null && timeInSeconds < 3600) {
                        // For EMOM/round-based workouts, use Round names. Only use "Finish Time" if it's the only time.
                        // Check if this is likely a round-based workout (multiple times in sequence)
                        const isRoundBased = scoreGrids.length > 2; // If there are multiple score lines, likely rounds
                        const scoreName = setIndex > 0
                            ? `Set ${setIndex}` as ScoreName
                            : (roundIndex === 0 && !isRoundBased)
                                ? 'Finish Time' as ScoreName
                                : `Round ${roundIndex + 1}` as ScoreName;

                        scores.push({
                            name: scoreName,
                            type: 'time',
                            value: formatSecondsToTime(timeInSeconds),
                            metadata: { timeInSeconds },
                        });
                        roundIndex++;
                        continue;
                    }
                }
            }

            // Reps format: "8 | + | 25 | 11/16/25" or "8 | + | 25 |"
            // Grid structure: [rounds, "+", repsIntoNext, date/metadata]
            if (validateGridColumns(workingGrid, 3, 3) && col1 === '+') {
                const rounds = parseInt(col0, 10);
                const repsIntoNext = parseInt(col2, 10) || 0;

                // Date is in col3 if present, but we ignore it for parsing

                const scoreName = setIndex > 0
                    ? `Set ${setIndex}` as ScoreName
                    : roundIndex === 0
                        ? 'Total' as ScoreName
                        : `Round ${roundIndex}` as ScoreName;

                scores.push({
                    name: scoreName,
                    type: 'reps',
                    value: `${rounds} + ${repsIntoNext}`,
                    metadata: {
                        rounds: rounds,
                        repsIntoNextRound: repsIntoNext,
                        totalReps: rounds + repsIntoNext, // Simplified
                    },
                });
                roundIndex++;
                continue;
            }

            // Single number (could be reps or time)
            if (workingGrid.length === 1 && col0) {
                const num = parseInt(col0, 10);
                if (!isNaN(num)) {
                    // Check if it's a time (MM:SS format without colon)
                    const timeInSeconds = parseTimeToSeconds(col0);
                    if (timeInSeconds !== null && timeInSeconds < 3600 && num >= 60) {
                        // Likely a time
                        const scoreName = setIndex > 0
                            ? `Set ${setIndex}` as ScoreName
                            : roundIndex === 0
                                ? 'Finish Time' as ScoreName
                                : `Round ${roundIndex}` as ScoreName;

                        scores.push({
                            name: scoreName,
                            type: 'time',
                            value: formatSecondsToTime(timeInSeconds),
                            metadata: { timeInSeconds },
                        });
                        roundIndex++;
                        continue;
                    } else {
                        // Likely reps
                        // Check if time cap was hit (if timeCap is set and this is a reps score)
                        const scoreName = setIndex > 0
                            ? `Set ${setIndex}` as ScoreName
                            : timeCap !== undefined
                                ? 'Time Cap' as ScoreName
                                : roundIndex === 0
                                    ? 'Total' as ScoreName
                                    : `Round ${roundIndex}` as ScoreName;

                        scores.push({
                            name: scoreName,
                            type: 'reps', // Time cap scenarios use "reps" type
                            value: String(num),
                            metadata: {
                                totalReps: num,
                            },
                        });
                        roundIndex++;
                        continue;
                    }
                }
            }

            // Weight format: "315 | lbs |"
            if (validateGridColumns(workingGrid, 2, 2)) {
                const weightMatch = col0.match(/(\d+)/);
                if (weightMatch && parseInt(weightMatch[1], 10) > 50) {
                    scores.push({
                        name: setIndex > 0 ? `Set ${setIndex}` as ScoreName : 'Weight' as ScoreName,
                        type: 'weight',
                        value: trimmed.replace(/\|/g, ' ').trim(),
                        metadata: {
                            weight: parseInt(weightMatch[1], 10),
                            unit: col1 || 'lbs',
                        },
                    });
                    continue;
                }
            }
        }

        // Time format: "4:06", "406", "4 06", "Start: 0:00, Stop: 1:13"
        // Check for start/stop times first
        const startStopMatch = trimmed.match(/start:\s*(\d{1,2}):?(\d{2})\s*,\s*stop:\s*(\d{1,2}):?(\d{2})/i);
        if (startStopMatch) {
            const startTime = `${startStopMatch[1]}:${startStopMatch[2]}`;
            const stopTime = `${startStopMatch[3]}:${startStopMatch[4]}`;
            const startSeconds = parseTimeToSeconds(startTime);
            const stopSeconds = parseTimeToSeconds(stopTime);

            if (startSeconds !== null && stopSeconds !== null) {
                const roundTime = stopSeconds - startSeconds;
                scores.push({
                    name: `Round ${roundIndex || 1}` as ScoreName,
                    type: 'time',
                    value: formatSecondsToTime(roundTime),
                    metadata: {
                        timeInSeconds: roundTime,
                        startTime: startTime,
                        stopTime: stopTime,
                        roundTime: roundTime,
                    },
                });
                roundIndex++;
                continue;
            }
        }

        // Regular time format: "4:06" or "406" (omitted colon)
        const timeMatch = trimmed.match(/(\d{1,2}):?(\d{2})/);
        if (timeMatch) {
            const timeInSeconds = parseTimeToSeconds(trimmed);
            if (timeInSeconds !== null && timeInSeconds < 3600) { // Less than 1 hour (reasonable workout time)
                const scoreName = setIndex > 0
                    ? `Set ${setIndex}` as ScoreName
                    : roundIndex === 0
                        ? 'Finish Time' as ScoreName
                        : `Round ${roundIndex}` as ScoreName;

                scores.push({
                    name: scoreName,
                    type: 'time',
                    value: formatSecondsToTime(timeInSeconds),
                    metadata: { timeInSeconds },
                });
                roundIndex++;
                continue;
            }
        }

        // Reps format: "3 rounds + 15 reps", "3+15", "8 + 25", "25 reps", "8 rounds"
        // Also handle lines with dates like "8 + 25 11/16/25" - strip date first
        // Remove date patterns (MM/DD/YY or MM/DD/YYYY) from the line before parsing
        let scoreLine = trimmed;
        const dateMatch = scoreLine.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
        if (dateMatch) {
            // Remove date from line (it's metadata, not part of the score)
            scoreLine = scoreLine.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/, '').trim();
        }

        const repsMatch = scoreLine.match(/(\d+)\s*(?:rounds?)?\s*(?:\+\s*)?(\d+)?\s*(?:reps?)?/i);
        if (repsMatch) {
            const firstNum = parseInt(repsMatch[1], 10);
            const secondNum = repsMatch[2] ? parseInt(repsMatch[2], 10) : null;

            // Determine if this is "rounds + reps" or just "reps"
            let rounds: number | undefined;
            let repsIntoNext: number | undefined;
            let totalReps: number;

            if (trimmed.toLowerCase().includes('round')) {
                // Has "round" - first number is rounds
                rounds = firstNum;
                repsIntoNext = secondNum || 0;
                totalReps = rounds + repsIntoNext; // Simplified - needs workout context for accurate calc
            } else if (secondNum !== null) {
                // Two numbers with "+" - assume "rounds + reps" format
                // This handles "8 + 25" even without the word "rounds"
                rounds = firstNum;
                repsIntoNext = secondNum;
                totalReps = rounds + repsIntoNext;
            } else {
                // Single number - could be total reps or rounds
                // If it's a small number (< 20) and line says "rounds", it's rounds
                if (trimmed.toLowerCase().includes('round') || firstNum < 20) {
                    rounds = firstNum;
                    totalReps = firstNum; // Simplified
                } else {
                    // Likely total reps
                    totalReps = firstNum;
                }
            }

            const scoreName = setIndex > 0
                ? `Set ${setIndex}` as ScoreName
                : roundIndex === 0
                    ? 'Total' as ScoreName
                    : `Round ${roundIndex}` as ScoreName;

            scores.push({
                name: scoreName,
                type: 'reps',
                value: trimmed,
                metadata: {
                    rounds,
                    repsIntoNextRound: repsIntoNext,
                    totalReps,
                },
            });
            roundIndex++;
            continue;
        }

        // Weight format: "315", "315 lbs", "315lbs", "315kg"
        const weightMatch = trimmed.match(/(\d+)\s*(lbs|kg)?/i);
        if (weightMatch && parseInt(weightMatch[1], 10) > 50) { // Reasonable weight threshold
            scores.push({
                name: setIndex > 0 ? `Set ${setIndex}` as ScoreName : 'Weight' as ScoreName,
                type: 'weight',
                value: trimmed,
                metadata: {
                    weight: parseInt(weightMatch[1], 10),
                    unit: weightMatch[2] || 'lbs',
                },
            });
            continue;
        }
    }

    // If there's only one time score and it's named "Round 1", rename it to "Finish Time"
    const timeScores = scores.filter(s => s.type === 'time');
    if (timeScores.length === 1 && timeScores[0].name === 'Round 1') {
        timeScores[0].name = 'Finish Time' as ScoreName;
    }

    return scores;
}

/**
 * Detect workout type from title, movements, and scores
 */
function detectWorkoutType(title: string, movements: WorkoutElement[], scores: ScoreElement[]): string {
    const titleLower = title.toLowerCase();

    // Check title for workout type keywords
    if (titleLower.includes('amrap')) return 'AMRAP';
    if (titleLower.match(/e\d+mom/i)) return 'EMOM';
    if (titleLower.includes('emom')) return 'EMOM';
    if (titleLower.includes('chipper')) return 'Chipper';
    if (titleLower.includes('rounds for time')) return 'Rounds for Time';
    if (titleLower.includes('for time')) return 'For Time';
    if (titleLower.includes('for reps')) return 'For Reps';

    // Infer from structure
    if (movements.length === 1 && movements[0].movement?.amount) {
        const amountStr = String(movements[0].movement.amount);
        if (amountStr.includes('x')) {
            return 'Lift';
        }
    }

    // Check score patterns
    if (scores.length === 1 && scores[0].type === 'time') {
        return 'For Time';
    }
    if (scores.length === 1 && scores[0].type === 'reps') {
        return 'For Reps';
    }

    return 'Unknown';
}

/**
 * Generate description using templates
 */
function generateDescription(workoutType: string, movements: WorkoutElement[]): string {
    const templates: Record<string, string> = {
        'AMRAP': 'A brutal AMRAP with {movement1} and {movement2}.',
        'EMOM': 'An {type} with high output in {movement1} and {movement2}.',
        'Chipper': 'A savage chipper that tested {movement1}, {movement2}, and {movement3}.',
        'Rounds for Time': 'A fast-paced {type} with {movement1} and {movement2}.',
        'Lift': 'Heavy {type} session with {movement1}.',
        'For Time': 'A {type} that pushed the limits with {movement1} and {movement2}.',
        'For Reps': 'A {type} that tested everything from {movement1} to {movement2}.',
    };

    // Extract movement names
    const movementNames = movements
        .filter(el => el.type === 'movement' && el.movement?.exercise)
        .map(el => el.movement!.exercise)
        .slice(0, 3); // Top 3 movements

    if (movementNames.length === 0) {
        return `A ${workoutType} workout.`;
    }

    // Select template
    const template = templates[workoutType] || `A {type} with {movement1} and {movement2}.`;

    // Fill template
    let description = template
        .replace('{type}', workoutType)
        .replace('{movement1}', movementNames[0] || 'movements')
        .replace('{movement2}', movementNames[1] || 'movements')
        .replace('{movement3}', movementNames[2] || 'movements');

    return description;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(ocrData: OCRData, elements: WorkoutElement[], scores: ScoreElement[]): number {
    // Average OCR word confidence
    const avgConfidence = ocrData.words.length > 0
        ? ocrData.words.reduce((sum, w) => sum + w.confidence, 0) / ocrData.words.length / 100
        : 0.5;

    // Parsing success rate
    const parsingSuccess = (elements.length > 0 || scores.length > 0) ? 0.9 : 0.5;

    // Data completeness
    const hasTitle = true; // Always have a title (even if inferred)
    const hasMovements = elements.length > 0;
    const hasScores = scores.length > 0;
    const completeness = (hasTitle ? 0.3 : 0) + (hasMovements ? 0.4 : 0) + (hasScores ? 0.3 : 0);

    // Weighted average
    return (avgConfidence * 0.4) + (parsingSuccess * 0.3) + (completeness * 0.3);
}

/**
 * Parse workout from raw text (for testing/iteration without calling Gemini)
 */
export function parseWorkoutFromRawText(rawText: string): WorkoutExtraction {
    // Clean up Gemini's pipe output before parsing
    const cleanedText = cleanGeminiPipeOutput(rawText);

    // Create OCRData structure from raw text
    const textLines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract words with confidence for confidence calculation
    const words: OCRData['words'] = textLines
        .flatMap(lineText => lineText.split(/\s+/))
        .map(word => ({
            text: word,
            confidence: 0.95,
        }));

    const ocrData: OCRData = {
        text: textLines.join('\n'),
        words,
        lines: textLines, // Just the text lines
    };

    // Step 2: Get all lines and build full grid structure
    const allLines = getAllLines(ocrData);
    const grid = buildGrid(allLines);

    // Step 3: Parse sections from grid
    const titleData = parseTitle(grid);
    const title = titleData.title;
    const movements = parseMovements(grid);
    const scores = parseScores(grid, titleData.timeCap);

    // Step 4: Detect workout type
    const workoutType = detectWorkoutType(title, movements, scores);

    // Step 5: Generate description
    const description = generateDescription(workoutType, movements);

    // Step 6: Calculate confidence
    const confidence = calculateConfidence(ocrData, movements, scores);

    // Improve title if it was just a code
    let finalTitle = title;
    if (title.match(/^E\d+MOM$/i)) {
        const minutes = title.match(/E(\d+)MOM/i)?.[1] || '1';
        finalTitle = `E${minutes}MOM`;
    } else if (title === 'Workout' || title.trim() === '') {
        // Generate title from workout type and movements
        const movementNames = movements
            .filter(el => el.type === 'movement' && el.movement?.exercise)
            .map(el => el.movement!.exercise)
            .slice(0, 2);

        if (movementNames.length > 0) {
            finalTitle = `${workoutType}: ${movementNames.join(' + ')}`;
        } else {
            finalTitle = `${workoutType} Workout`;
        }
    }

    return {
        title: finalTitle,
        description,
        workout: movements,
        score: scores,
        confidence,
        privacy: 'public',
    };
}

/**
 * Internal function to parse from OCR data
 */
function parseFromOCRData(ocrData: OCRData): WorkoutExtraction {
    const parsingStartTime = Date.now();
    console.log(`  [Parsing] Starting parsing of ${ocrData.lines.length} lines...`);

    // Step 2: Get all lines and build full grid structure
    const gridStartTime = Date.now();
    const allLines = getAllLines(ocrData);
    const grid = buildGrid(allLines);
    console.log(`  [Parsing] Grid built: ${grid.length} lines, ${grid[0]?.length || 0} columns (${((Date.now() - gridStartTime) / 1000).toFixed(3)}s)`);

    // Step 3: Parse sections from grid
    const parseStartTime = Date.now();
    const titleData = parseTitle(grid);
    const title = titleData.title;
    const movements = parseMovements(grid);
    const scores = parseScores(grid, titleData.timeCap);
    console.log(`  [Parsing] Parsed: title="${title}", ${movements.length} movements, ${scores.length} scores (${((Date.now() - parseStartTime) / 1000).toFixed(3)}s)`);

    // Step 4: Detect workout type
    const typeStartTime = Date.now();
    const workoutType = detectWorkoutType(title, movements, scores);
    console.log(`  [Parsing] Workout type: ${workoutType} (${((Date.now() - typeStartTime) / 1000).toFixed(3)}s)`);

    // Step 5: Generate description
    const descStartTime = Date.now();
    const description = generateDescription(workoutType, movements);
    console.log(`  [Parsing] Description generated (${((Date.now() - descStartTime) / 1000).toFixed(3)}s)`);

    // Step 6: Calculate confidence
    const confStartTime = Date.now();
    const confidence = calculateConfidence(ocrData, movements, scores);
    const totalParsingTime = Date.now() - parsingStartTime;
    console.log(`  [Parsing] Confidence: ${(confidence * 100).toFixed(1)}% (${((Date.now() - confStartTime) / 1000).toFixed(3)}s)`);
    console.log(`  [Parsing] Total parsing time: ${(totalParsingTime / 1000).toFixed(2)}s`);

    // Improve title if it was just a code
    let finalTitle = title;
    if (title.match(/^E\d+MOM$/i)) {
        const minutes = title.match(/E(\d+)MOM/i)?.[1] || '1';
        finalTitle = `E${minutes}MOM`;
    } else if (title === 'Workout' || title.trim() === '') {
        // Generate title from workout type and movements
        const movementNames = movements
            .filter(el => el.type === 'movement' && el.movement?.exercise)
            .map(el => el.movement!.exercise)
            .slice(0, 2);

        if (movementNames.length > 0) {
            finalTitle = `${workoutType}: ${movementNames.join(' + ')}`;
        } else {
            finalTitle = `${workoutType} Workout`;
        }
    }

    return {
        title: finalTitle,
        description,
        workout: movements,
        score: scores,
        confidence,
        privacy: 'public',
    };
}

/**
 * Main extraction function
 */
export const workoutExtractorOCR = {
    async extract(imageBase64: string): Promise<WorkoutExtraction> {
        // Step 1: Text extraction using Gemini (OCR-like functionality)
        const ocrData = await extractTextWithGemini(imageBase64);
        return parseFromOCRData(ocrData);
    },

    /**
     * Extract raw text only (for saving/testing)
     */
    async extractRawText(imageBase64: string): Promise<string> {
        const ocrData = await extractTextWithGemini(imageBase64);
        return ocrData.text;
    },

    /**
     * Extract both raw text and parsed workout (more efficient than calling both separately)
     */
    async extractWithRawText(imageBase64: string): Promise<{ extraction: WorkoutExtraction; rawText: string }> {
        const ocrData = await extractTextWithGemini(imageBase64);
        const extraction = parseFromOCRData(ocrData);
        return { extraction, rawText: ocrData.text };
    },
};

