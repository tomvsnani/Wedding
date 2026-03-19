interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function JobDescriptionInput({
  value,
  onChange,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Job Description
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {value.length.toLocaleString()} characters
          </span>
          {value && (
            <button
              onClick={() => onChange('')}
              disabled={disabled}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the job description here..."
        className={`
          w-full min-h-[200px] bg-slate-800/50 border border-slate-600 rounded-lg p-4
          text-slate-200 placeholder-slate-500 text-sm leading-relaxed resize-y
          focus:outline-none focus:border-teal-500 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
}
