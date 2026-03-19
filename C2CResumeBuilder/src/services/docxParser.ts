import JSZip from 'jszip';
import type { DocxContent, EnhancementResult } from '../types/index.js';
import { extractTextFromXml, applyEnhancements } from './xmlHelpers.js';

/**
 * Extract content from a DOCX file.
 * A DOCX is a ZIP archive; the main content lives in word/document.xml.
 */
export async function extractDocxContent(file: File): Promise<DocxContent> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('Invalid DOCX file: missing word/document.xml');
  }

  const documentXml = await documentXmlFile.async('string');
  const textContent = extractTextFromXml(documentXml);

  return {
    zip,
    documentXml,
    textContent,
    textSegments: [],
  };
}

/**
 * Apply enhancements to the DOCX and return a downloadable Blob.
 * Only modifies text in <w:t> tags; all formatting, images, styles are untouched.
 */
export async function replaceContent(
  zip: JSZip,
  originalXml: string,
  result: EnhancementResult
): Promise<Blob> {
  const newXml = applyEnhancements(
    originalXml, 
    result.enhancedSections, 
    result.executiveSummary, 
    result.atsKeywords
  );
  zip.file('word/document.xml', newXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
