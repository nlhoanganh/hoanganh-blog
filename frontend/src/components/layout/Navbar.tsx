import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          ✍️ My Blog
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </Link>
          <Link
            to="/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Post
          </Link>
        </div>
      </div>
    </nav>
  );
}
