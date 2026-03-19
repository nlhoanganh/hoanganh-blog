import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <p className="text-9xl font-bold text-gray-100 select-none">404</p>
      <h1 className="text-2xl font-semibold text-gray-700 -mt-6">Page not found</h1>
      <p className="text-gray-400 text-sm">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}
