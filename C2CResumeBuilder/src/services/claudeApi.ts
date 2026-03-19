import type { EnhancementResult } from '../types/index.js';

const SYSTEM_PROMPT = `You are a C2C resume enhancement specialist. Your task is to enhance an existing resume to better match a specific job description, you have 15 years of professional experience in architecting developing and hiring, tailor the resume for ATS and keyword match and best possible hiring.

## Your Goals:
1. Identify keywords, technologies, and skills from the job description
2. Enhance existing resume bullets to incorporate relevant JD terms
3. Add technical depth where the resume is vague
4. Ensure the resume demonstrates experience matching JD requirements
5. Keep the resume 5-6 pages (do not significantly shorten)
6. Remove points that are absolutely irrelevant to the JD

## Rules - YOU MUST FOLLOW:
1. PRESERVE all existing experience - do not fabricate or remove roles
2. ENHANCE bullets, don't replace them entirely
3. Keep at least 60% of original content
4. Add version numbers to technologies ONLY if that version was actually released during the date range of that specific job. Do not create historical inaccuracies (e.g., adding React 18 to a role from 2018).
5. Expand acronyms if they appear in the JD expanded
6. If a bullet is completely unrelated to the JD, remove it using the "removed" changeType. EXCEPTION: NEVER remove points showcasing architectural, cloud, infrastructure, or DevOps experience (e.g., Docker, GKE, AWS, CI/CD, System Design). Preserve and enhance them to show how this broad knowledge benefits the specific role, as it demonstrates valuable seniority.
7. Do NOT just lazily insert JD keywords into existing bullets. When adding a tool or keyword, add intelligent, technically deep context explaining HOW it was used (e.g., instead of just adding "React", explain "Utilized React memoization (useMemo, useCallback) to optimize render cycles").
8. Do NOT add brand new bullet points. Only enhance, expand, or reword EXISTING bullets to incorporate JD keywords and technical depth.
9. Do NOT fabricate experience or skills the person doesn't have
10. Remove duplicate points if they are deemed already exists in that section

## CRITICAL TEXT RULES:
- The "originalText" field MUST be the EXACT text from the resume, character-for-character
- Do NOT truncate, abbreviate, or paraphrase the originalText
- Do NOT combine multiple bullet points into one originalText
- Each originalText must match EXACTLY ONE paragraph/bullet from the resume
- Use plain ASCII characters in enhancedText: straight quotes (') not curly quotes, regular hyphens (-) not em-dashes
- Do NOT include any special Unicode characters in enhancedText

## Output Format:
You MUST return ONLY a valid JSON object. No markdown, no code fences, no explanations before or after.
The JSON must have this EXACT structure:

{
  "enhancedSections": [
    {
      "originalText": "the exact original text from resume paragraph",
      "enhancedText": "the enhanced version with JD keywords incorporated",
      "changeType": "enhanced",
      "reason": "brief explanation"
    }
  ],
  "summary": {
    "keywordsAdded": ["keyword1", "keyword2"],
    "bulletsEnhanced": 15,
    "bulletsAdded": 3,
    "bulletsUnchanged": 12,
    "bulletsRemoved": 2
  }
}

Valid changeType values: "enhanced", "expanded", "unchanged", "removed"
- "enhanced": modified an existing bullet to incorporate JD keywords
- "expanded": significantly expanded a brief bullet with more technical detail
- "unchanged": kept as-is (originalText and enhancedText are the same)
- "removed": completely removed because the bullet is irrelevant to the JD

IMPORTANT: Do NOT use changeType "added". Only modify existing bullets. Never invent new paragraphs.
For "unchanged" items, enhancedText must equal originalText exactly.
For "removed" items, enhancedText must be an empty string "".`;

export async function enhanceResume(
  resumeContent: string,
  jobDescription: string,
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<EnhancementResult> {
  onProgress?.('Sending resume to Claude for analysis...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `## RESUME CONTENT:\n${resumeContent}\n\n## JOB DESCRIPTION:\n${jobDescription}\n\nEnhance this resume for the job description. Return ONLY valid JSON, no markdown fences or other text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Anthropic API key.');
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    throw new Error(`API error (${response.status}): ${errorBody}`);
  }

  onProgress?.('Processing AI response...');

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Claude API');
  }

  // Parse JSON - handle potential markdown code fences
  let jsonStr = content.trim();

  // Strip markdown fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  }

  // Strip any leading/trailing non-JSON text
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  try {
    const result: EnhancementResult = JSON.parse(jsonStr);

    // Validate the response structure
    if (!result.enhancedSections || !Array.isArray(result.enhancedSections)) {
      throw new Error('Invalid response structure: missing enhancedSections array');
    }
    if (!result.summary) {
      throw new Error('Invalid response structure: missing summary object');
    }

    // Sanitize each section
    result.enhancedSections = result.enhancedSections.map((section) => ({
      originalText: String(section.originalText || ''),
      enhancedText: String(section.enhancedText || ''),
      changeType: (['enhanced', 'expanded', 'added', 'unchanged', 'removed'].includes(section.changeType)
        ? section.changeType
        : 'enhanced') as 'enhanced' | 'expanded' | 'added' | 'unchanged' | 'removed',
      reason: String(section.reason || ''),
    }));

    // Ensure summary has required fields
    result.summary = {
      keywordsAdded: Array.isArray(result.summary.keywordsAdded)
        ? result.summary.keywordsAdded.map(String)
        : [],
      bulletsEnhanced: Number(result.summary.bulletsEnhanced) || 0,
      bulletsAdded: Number(result.summary.bulletsAdded) || 0,
      bulletsUnchanged: Number(result.summary.bulletsUnchanged) || 0,
      bulletsRemoved: Number(result.summary.bulletsRemoved) || 0,
    };

    return result;
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Failed to parse Claude response:', content.substring(0, 500));
      throw new Error(
        'Failed to parse AI response as JSON. The AI may have returned malformed output. Please try again.'
      );
    }
    throw e;
  }
}
