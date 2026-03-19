interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <p className="text-gray-600 text-lg">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
