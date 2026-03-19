import { Link } from 'react-router-dom';
import type { PostSummary } from '../../types';
import TagBadge from './TagBadge';

interface Props {
  post: PostSummary;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function PostCard({ post }: Props) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {post.coverImageUrl && (
        <img
          src={`${API_BASE}${post.coverImageUrl}`}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-6 flex flex-col flex-1">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
          <Link
            to={`/posts/${post.id}`}
            className="hover:text-indigo-600 transition-colors line-clamp-2"
          >
            {post.title}
          </Link>
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <time className="text-xs text-gray-400">{formattedDate}</time>
          <Link
            to={`/posts/${post.id}`}
            className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition-colors"
          >
            Read more →
          </Link>
        </div>
      </div>
    </article>
  );
}
