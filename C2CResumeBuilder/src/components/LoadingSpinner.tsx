interface LoadingSpinnerProps {
  status?: string;
}

export default function LoadingSpinner({ status }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
      </div>
      {status && (
        <p className="text-slate-300 text-sm animate-pulse">{status}</p>
      )}
    </div>
  );
}
