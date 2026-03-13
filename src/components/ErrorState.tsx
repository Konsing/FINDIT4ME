interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-4">
      <p className="text-[#888] text-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-white bg-[#1a1a1a] border border-[#333] rounded-full px-4 py-2 hover:bg-[#222] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
