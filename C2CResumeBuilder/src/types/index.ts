import type JSZip from 'jszip';

export interface EnhancedSection {
  originalText: string;
  enhancedText: string;
  changeType: 'enhanced' | 'expanded' | 'added' | 'unchanged' | 'removed';
  reason: string;
}

export interface EnhancementResult {
  enhancedSections: EnhancedSection[];
  summary: {
    keywordsAdded: string[];
    bulletsEnhanced: number;
    bulletsAdded: number;
    bulletsUnchanged: number;
    bulletsRemoved: number;
  };
}

export interface ResumeState {
  file: File | null;
  originalContent: string;
  documentXml: string;
  zip: JSZip | null;
  isProcessing: boolean;
  error: string | null;
  result: EnhancementResult | null;
}

export interface DocxContent {
  zip: JSZip;
  documentXml: string;
  textContent: string;
  textSegments: TextSegment[];
}

export interface TextSegment {
  text: string;
  index: number;
}
