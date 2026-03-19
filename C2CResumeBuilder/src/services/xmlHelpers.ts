/**
 * XML helper utilities for safe text replacement in DOCX XML.
 * Uses DOMParser for reading, targeted string replacement for writing.
 * This hybrid approach avoids XMLSerializer namespace mangling that breaks Word.
 */

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Parse DOCX XML string into a DOM Document (for reading only).
 */
function parseXml(xml: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse document XML: ' + parseError.textContent);
  }
  return doc;
}

/**
 * Extract the combined text of all <w:t> elements within a paragraph element.
 */
function getParagraphTextFromElement(paragraph: Element): string {
  const tElements = paragraph.getElementsByTagNameNS(W_NS, 't');
  let text = '';
  for (let i = 0; i < tElements.length; i++) {
    text += tElements[i].textContent || '';
  }
  return text.trim();
}

/**
 * Extract all readable text from DOCX XML, one paragraph per line.
 */
export function extractTextFromXml(xml: string): string {
  const doc = parseXml(xml);
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
  const lines: string[] = [];

  for (const p of paragraphs) {
    const text = getParagraphTextFromElement(p);
    if (text) {
      lines.push(text);
    }
  }

  return lines.join('\n');
}

/**
 * Decode XML entities to plain text for comparison.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

/**
 * Normalize text for fuzzy matching between Claude's output and the XML content.
 */
function normalizeText(text: string): string {
  return decodeXmlEntities(text)
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Escape text for safe inclusion in XML <w:t> elements.
 * Only escapes the 3 characters that MUST be escaped in XML text content.
 * Avoids over-escaping quotes/apostrophes which are valid in text nodes.
 */
function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Extract text from a paragraph XML string using regex.
 * Handles <w:t> elements that may contain text with XML entities.
 */
function extractTextFromParagraphString(pXml: string): string {
  const texts: string[] = [];
  // Match <w:t ...>text</w:t> — text content is everything between > and </w:t>
  // that doesn't contain other XML tags (text nodes only)
  const tRegex = /<w:t(?:\s[^>]*)?>([^]*?)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = tRegex.exec(pXml)) !== null) {
    texts.push(decodeXmlEntities(m[1]));
  }
  return texts.join('').trim();
}

interface ParagraphMatch {
  fullXml: string;
  text: string;
  startIndex: number;
  endIndex: number;
  isInTable: boolean;
}

/**
 * Check if a position in the XML is inside a table cell (<w:tc>).
 */
function isInsideTable(xml: string, position: number): boolean {
  // Count open and close tc tags before this position
  const before = xml.substring(0, position);
  const tcOpens = (before.match(/<w:tc[\s>]/g) || []).length;
  const tcCloses = (before.match(/<\/w:tc>/g) || []).length;
  return tcOpens > tcCloses;
}

/**
 * Find all <w:p>...</w:p> blocks in the XML string with their positions.
 */
function findAllParagraphs(xml: string): ParagraphMatch[] {
  const results: ParagraphMatch[] = [];
  const openTagRegex = /<w:p[\s>]/g;
  let openMatch: RegExpExecArray | null;

  while ((openMatch = openTagRegex.exec(xml)) !== null) {
    const startIdx = openMatch.index;
    const closeTag = '</w:p>';
    const closeIdx = xml.indexOf(closeTag, startIdx);
    if (closeIdx === -1) continue;

    const endIdx = closeIdx + closeTag.length;
    const fullXml = xml.substring(startIdx, endIdx);

    // Skip paragraphs that themselves contain nested <w:p> (shouldn't happen,
    // but guard against it)
    const innerPCount = (fullXml.match(/<w:p[\s>]/g) || []).length;
    if (innerPCount > 1) {
      openTagRegex.lastIndex = startIdx + openMatch[0].length;
      continue;
    }

    const text = extractTextFromParagraphString(fullXml);
    const inTable = isInsideTable(xml, startIdx);

    results.push({
      fullXml,
      text,
      startIndex: startIdx,
      endIndex: endIdx,
      isInTable: inTable,
    });

    openTagRegex.lastIndex = endIdx;
  }

  return results;
}

/**
 * Replace text within a paragraph XML string.
 * Strategy: consolidate all text into the first <w:r> that contains a <w:t>,
 * preserving its formatting. Remove text from subsequent <w:t>s.
 *
 * This carefully handles:
 * - Multiple <w:r> runs with different formatting
 * - <w:tab/>, <w:br/> and other inline elements within runs
 * - proofErr elements between runs
 */
function replaceParagraphTextInString(paragraphXml: string, newText: string): string {
  const escaped = escapeXmlText(newText);
  let firstReplaced = false;

  // Replace content of each <w:t>...</w:t>, putting all text in the first one
  return paragraphXml.replace(
    /<w:t(?:\s[^>]*)?>([^]*?)<\/w:t>/g,
    () => {
      if (!firstReplaced) {
        firstReplaced = true;
        return `<w:t xml:space="preserve">${escaped}</w:t>`;
      }
      // Empty subsequent text runs but keep the tag structure valid
      return `<w:t xml:space="preserve"></w:t>`;
    }
  );
}

/**
 * Validate that the result XML is well-formed.
 */
function validateXml(xml: string): { valid: boolean; error?: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return { valid: false, error: parseError.textContent || 'Parse error' };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}

/**
 * Apply all enhancements to the document XML.
 * Uses targeted string replacement to avoid XMLSerializer namespace issues.
 */
export function applyEnhancements(
  xml: string,
  enhancements: Array<{ originalText: string; enhancedText: string; changeType: string }>
): string {
  const paragraphs = findAllParagraphs(xml);
  // Only consider paragraphs NOT inside tables for replacement
  // (table content has complex structure that's risky to modify via string replacement)
  const replaceableParagraphs = paragraphs.filter((p) => !p.isInTable);
  const usedIndices = new Set<number>();
  let result = xml;
  let offset = 0;

  for (const enhancement of enhancements) {
    if (enhancement.changeType === 'unchanged' || enhancement.changeType === 'added') {
      continue;
    }

    const normalizedTarget = normalizeText(enhancement.originalText);
    if (!normalizedTarget) continue;

    let bestMatch: ParagraphMatch | null = null;
    let bestIdx = -1;

    // Exact normalized match
    for (let i = 0; i < replaceableParagraphs.length; i++) {
      if (usedIndices.has(i)) continue;
      if (normalizeText(replaceableParagraphs[i].text) === normalizedTarget) {
        bestMatch = replaceableParagraphs[i];
        bestIdx = i;
        break;
      }
    }

    // Fallback: substring containment for long texts
    if (!bestMatch && normalizedTarget.length > 30) {
      for (let i = 0; i < replaceableParagraphs.length; i++) {
        if (usedIndices.has(i)) continue;
        const pNorm = normalizeText(replaceableParagraphs[i].text);
        if (
          pNorm.length > 20 &&
          (pNorm.includes(normalizedTarget) || normalizedTarget.includes(pNorm))
        ) {
          bestMatch = replaceableParagraphs[i];
          bestIdx = i;
          break;
        }
      }
    }

    if (bestMatch && bestIdx >= 0) {
      usedIndices.add(bestIdx);

      const newParagraphXml = replaceParagraphTextInString(
        bestMatch.fullXml,
        enhancement.enhancedText
      );

      const adjStart = bestMatch.startIndex + offset;
      const adjEnd = bestMatch.endIndex + offset;

      result = result.substring(0, adjStart) + newParagraphXml + result.substring(adjEnd);
      offset += newParagraphXml.length - bestMatch.fullXml.length;
    }
  }

  // Skip 'added' items — inserting new paragraphs risks formatting issues
  // (wrong position, inherited bold/styles, broken document structure).
  // The AI prompt now instructs Claude to only enhance existing bullets.

  // Validate the output XML
  const validation = validateXml(result);
  if (!validation.valid) {
    console.error('XML validation failed after enhancement:', validation.error);
    console.error('Returning original XML to prevent corruption');
    return xml;
  }

  return result;
}
