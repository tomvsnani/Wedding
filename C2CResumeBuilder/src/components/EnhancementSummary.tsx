import type { EnhancementResult } from '../types/index.js';

interface EnhancementSummaryProps {
  result: EnhancementResult;
  onDownload: () => void;
  isDownloading?: boolean;
}

export default function EnhancementSummary({
  result,
  onDownload,
  isDownloading,
}: EnhancementSummaryProps) {
  const { summary } = result;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Enhancement Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 xl:col-span-1 rounded-lg p-3 text-center border-b-2 border-teal-500">
          <p className={`text-2xl font-bold ${result.atsScore >= 80 ? 'text-teal-400' : result.atsScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {result.atsScore || 0}%
          </p>
          <p className="text-xs text-slate-500 mt-1">ATS JD Match</p>
        </div>
        <StatCard
          label="Keywords Added"
          value={summary.keywordsAdded.length}
          color="teal"
        />
        <StatCard
          label="Bullets Enhanced"
          value={summary.bulletsEnhanced}
          color="blue"
        />
        <StatCard
          label="Bullets Added"
          value={summary.bulletsAdded}
          color="green"
        />
        <StatCard
          label="Unchanged"
          value={summary.bulletsUnchanged}
          color="slate"
        />
        <StatCard
          label="Removed"
          value={summary.bulletsRemoved}
          color="red"
        />
      </div>

      {summary.keywordsAdded.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Keywords Added</h3>
          <div className="flex flex-wrap gap-2">
            {summary.keywordsAdded.map((keyword, i) => (
              <span
                key={i}
                className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-1 rounded-full border border-teal-500/30"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* C2C Injected Blocks & Evaluation */}
      {(result.executiveSummary || result.atsKeywords || result.c2cMatchEvaluation) && (
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            C2C Evaluation & Injected Blocks
          </h3>
          
          {result.c2cMatchEvaluation && (
            <div className="mb-5 bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/20">
              <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-2">
                <span className="text-lg">🎯</span> Vendor Fit Assessment
              </h4>
              <p className="text-indigo-200/90 text-sm leading-relaxed">{result.c2cMatchEvaluation}</p>
            </div>
          )}

          {result.atsScoreReasoning && (
            <div className="mb-5 bg-slate-800/60 p-4 rounded-lg border border-slate-700">
              <h4 className="text-xs font-bold text-slate-400 mb-1">ATS Score Reasoning</h4>
              <p className="text-slate-300 text-sm leading-relaxed italic">"{result.atsScoreReasoning}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.executiveSummary && (
              <div className="bg-slate-900 rounded p-3 border border-slate-800/50">
                <h4 className="text-[11px] font-bold text-teal-400 mb-2 uppercase tracking-wider">Injected Executive Summary</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{result.executiveSummary}</p>
              </div>
            )}
            {result.atsKeywords && (
              <div className="bg-slate-900 rounded p-3 border border-slate-800/50">
                <h4 className="text-[11px] font-bold text-amber-400 mb-2 uppercase tracking-wider">Injected Keywords</h4>
                <p className="text-slate-300 text-sm font-mono">{result.atsKeywords}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change details */}
      <details className="mb-6">
        <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
          View detailed changes ({result.enhancedSections.filter(s => s.changeType !== 'unchanged').length} modifications)
        </summary>
        <div className="mt-3 max-h-64 overflow-y-auto space-y-3">
          {result.enhancedSections
            .filter((s) => s.changeType !== 'unchanged')
            .map((section, i) => (
              <div key={i} className="bg-slate-900/50 rounded p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      section.changeType === 'enhanced'
                        ? 'bg-blue-500/20 text-blue-300'
                        : section.changeType === 'expanded'
                          ? 'bg-purple-500/20 text-purple-300'
                          : section.changeType === 'removed'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {section.changeType}
                  </span>
                  <span className="text-slate-500">{section.reason}</span>
                </div>
                {section.originalText && (
                  <p className="text-slate-500 line-through mb-1">
                    {section.originalText.slice(0, 120)}
                    {section.originalText.length > 120 ? '...' : ''}
                  </p>
                )}
                <p className="text-slate-300">
                  {section.changeType === 'removed' ? (
                    <span className="italic text-slate-500">Removed from document</span>
                  ) : (
                    <>
                      {section.enhancedText.slice(0, 120)}
                      {section.enhancedText.length > 120 ? '...' : ''}
                    </>
                  )}
                </p>
              </div>
            ))}
        </div>
      </details>

      <div className="flex items-center gap-3">
        <span className="text-xs text-green-400">Original formatting preserved</span>
      </div>

      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="mt-4 w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
      >
        {isDownloading ? 'Preparing download...' : 'Download Enhanced Resume'}
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'text-teal-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    slate: 'text-slate-400',
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
      <p className={`text-2xl font-bold ${colorMap[color] || 'text-slate-400'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
