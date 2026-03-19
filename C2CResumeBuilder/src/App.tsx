import { useState, useCallback } from 'react';
import type JSZip from 'jszip';
import type { EnhancementResult } from './types/index.js';
import { extractDocxContent, replaceContent } from './services/docxParser.js';
import { enhanceResume } from './services/claudeApi.js';
import ApiKeyInput from './components/ApiKeyInput.js';
import FileUpload from './components/FileUpload.js';
import JobDescriptionInput from './components/JobDescriptionInput.js';
import LoadingSpinner from './components/LoadingSpinner.js';
import EnhancementSummary from './components/EnhancementSummary.js';

function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('anthropic_api_key') || ''
  );
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Store parsed DOCX data for download step
  const [docxData, setDocxData] = useState<{
    zip: JSZip;
    documentXml: string;
  } | null>(null);

  const [darkMode, setDarkMode] = useState(true);

  const canEnhance = file && jobDescription.trim() && apiKey && !isProcessing;

  const handleEnhance = useCallback(async () => {
    if (!file || !jobDescription.trim() || !apiKey) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setDocxData(null);

    try {
      // Step 1: Parse DOCX
      setProgressStatus('Extracting resume content...');
      const { zip, documentXml, textContent } = await extractDocxContent(file);
      setDocxData({ zip, documentXml });

      if (!textContent.trim()) {
        throw new Error('No text content found in the resume. The file may be image-based or corrupted.');
      }

      // Step 2: Send to Claude API
      setProgressStatus('Analyzing resume against job description...');
      const enhancementResult = await enhanceResume(
        textContent,
        jobDescription,
        apiKey,
        setProgressStatus
      );

      setResult(enhancementResult);
      setProgressStatus('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setProgressStatus('');
    } finally {
      setIsProcessing(false);
    }
  }, [file, jobDescription, apiKey]);

  const handleDownload = useCallback(async () => {
    if (!result || !docxData) return;

    setIsDownloading(true);
    try {
      const blob = await replaceContent(
        docxData.zip,
        docxData.documentXml,
        result.enhancedSections
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const originalName = file?.name || 'resume.docx';
      const enhancedName = originalName.replace(/\.docx$/i, '_enhanced.docx');
      a.href = url;
      a.download = enhancedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate download');
    } finally {
      setIsDownloading(false);
    }
  }, [result, docxData, file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setJobDescription('');
    setResult(null);
    setError(null);
    setDocxData(null);
    setProgressStatus('');
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-teal-400">C2C Resume Enhancer</h1>
            </div>
            <div className="flex items-center gap-4">
              <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1"
                title="Toggle theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Input Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <FileUpload
              file={file}
              onFileSelect={setFile}
              onClear={() => {
                setFile(null);
                setResult(null);
                setDocxData(null);
              }}
              disabled={isProcessing}
            />
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              disabled={isProcessing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={handleEnhance}
              disabled={!canEnhance}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Enhance Resume
            </button>
            {(file || jobDescription || result) && !isProcessing && (
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-200 text-sm py-3 px-4"
              >
                Reset
              </button>
            )}
          </div>

          {/* Validation messages */}
          {!apiKey && (
            <p className="text-center text-amber-400/80 text-sm mb-4">
              Enter your Anthropic API key above to get started.
            </p>
          )}

          {/* Loading State */}
          {isProcessing && <LoadingSpinner status={progressStatus} />}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <EnhancementSummary
              result={result}
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-slate-600">
            C2C Resume Enhancer — All processing happens client-side. Your resume data is only sent to Anthropic's API.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
