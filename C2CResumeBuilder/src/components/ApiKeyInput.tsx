import { useState } from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function ApiKeyInput({ apiKey, onApiKeyChange }: ApiKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const maskedKey = apiKey ? `${apiKey.slice(0, 7)}${'•'.repeat(20)}${apiKey.slice(-4)}` : '';

  function handleSave(value: string) {
    const trimmed = value.trim();
    onApiKeyChange(trimmed);
    if (trimmed) {
      localStorage.setItem('anthropic_api_key', trimmed);
      setIsEditing(false);
    }
  }

  function handleClear() {
    onApiKeyChange('');
    localStorage.removeItem('anthropic_api_key');
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-400 whitespace-nowrap">API Key:</label>
        <input
          type={isVisible ? 'text' : 'password'}
          placeholder="sk-ant-..."
          defaultValue={apiKey}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave(e.currentTarget.value);
          }}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-64"
        />
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-slate-400 hover:text-slate-200 text-sm"
          title={isVisible ? 'Hide' : 'Show'}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={(e) => {
            const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
            handleSave(input?.value || '');
          }}
          className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-3 py-1.5 rounded"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400">API Key:</label>
      <span className="text-sm text-slate-300 font-mono">{maskedKey}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-teal-400 hover:text-teal-300 text-sm"
      >
        Change
      </button>
      <button
        onClick={handleClear}
        className="text-red-400 hover:text-red-300 text-sm"
      >
        Clear
      </button>
    </div>
  );
}
