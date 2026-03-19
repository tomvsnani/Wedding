import { useCallback, useState } from 'react';

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

export default function FileUpload({ file, onFileSelect, onClear, disabled }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((f: File): boolean => {
    setError(null);
    const ext = f.name.toLowerCase().split('.').pop();

    if (ext === 'doc') {
      setError('Legacy .doc format is not supported. Please convert to .docx first.');
      return false;
    }
    if (ext === 'pdf') {
      setError('PDF format is not supported. Please upload a .docx file.');
      return false;
    }
    if (ext !== 'docx') {
      setError('Only .docx files are accepted.');
      return false;
    }
    return true;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f && validateFile(f)) {
        onFileSelect(f);
      }
    },
    [disabled, onFileSelect, validateFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f && validateFile(f)) {
        onFileSelect(f);
      }
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [onFileSelect, validateFile]
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-2 flex-1">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        Resume
      </h2>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !file) {
            document.getElementById('file-input')?.click();
          }
        }}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[200px]
          flex flex-col items-center justify-center cursor-pointer
          ${isDragOver
            ? 'border-teal-400 bg-teal-400/10'
            : file
              ? 'border-slate-600 bg-slate-800/50'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          id="file-input"
          type="file"
          accept=".docx"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">📄</div>
            <div>
              <p className="text-slate-200 font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                setError(null);
              }}
              disabled={disabled}
              className="text-sm text-red-400 hover:text-red-300 mt-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl text-slate-500">📁</div>
            <p className="text-slate-300">Drop resume here</p>
            <p className="text-slate-500 text-sm">.docx files only</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
}
