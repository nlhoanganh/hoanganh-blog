import { useNavigate, useParams } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import toast from 'react-hot-toast';
import { usePost } from '../hooks/usePost';
import { deletePost } from '../api/postApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import TagBadge from '../components/post/TagBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { post, loading, error, refetch } = usePost(Number(id));

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deletePost(Number(id));
      toast.success('Post deleted');
      navigate('/');
    } catch {
      // error toast handled by axios interceptor
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !post) return <ErrorMessage message={error ?? 'Post not found'} onRetry={refetch} />;

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="max-w-3xl mx-auto">
      {post.coverImageUrl && (
        <img
          src={`${API_BASE}${post.coverImageUrl}`}
          alt={post.title}
          className="w-full h-64 md:h-80 object-cover rounded-xl mb-8 shadow-sm"
        />
      )}

      <header className="mb-8">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <TagBadge key={tag} name={tag} />
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex items-center justify-between">
          <time className="text-sm text-gray-400">{formattedDate}</time>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete post
          </button>
        </div>
      </header>

      <div
        data-color-mode="light"
        className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm"
      >
        <MDEditor.Markdown source={post.content} />
      </div>

      <div className="mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={() => navigate('/')}
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
        >
          ← Back to all posts
        </button>
      </div>
    </article>
  );
}
