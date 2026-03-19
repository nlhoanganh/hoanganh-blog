import { usePosts } from '../hooks/usePosts';
import PostList from '../components/post/PostList';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function HomePage() {
  const { data, loading, error, page, setPage, refetch } = usePosts();

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
        <p className="mt-2 text-gray-500">Thoughts, ideas, and technical deep-dives</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}
      {!loading && !error && data && (
        <>
          <PostList posts={data.content} />
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
