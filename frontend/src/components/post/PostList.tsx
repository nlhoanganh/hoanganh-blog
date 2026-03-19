import { Link } from 'react-router-dom';
import type { PostSummary } from '../../types';
import PostCard from './PostCard';

interface Props {
  posts: PostSummary[];
}

export default function PostList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-5xl">📝</div>
        <p className="text-gray-500 text-lg font-medium">No posts yet</p>
        <p className="text-gray-400 text-sm">Be the first to write something!</p>
        <Link
          to="/create"
          className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Write your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
