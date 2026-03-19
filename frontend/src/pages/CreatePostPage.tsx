import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPost } from '../api/postApi';
import MarkdownEditor from '../components/editor/MarkdownEditor';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!content.trim()) { toast.error('Content is required'); return; }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    if (tags.trim()) formData.append('tags', tags.trim());
    if (coverImage) formData.append('coverImage', coverImage);

    setSubmitting(true);
    try {
      const response = await createPost(formData);
      toast.success('Post published!');
      navigate(`/posts/${response.data.id}`);
    } catch {
      // error toast handled by axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Post</h1>
        <p className="mt-1 text-gray-500">Write something worth sharing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An interesting title…"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg placeholder:text-gray-300"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, spring-boot, tutorial (comma-separated)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-300"
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cover Image
          </label>
          {coverPreview && (
            <div className="mb-3 relative group w-fit">
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-48 w-auto rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => { setCoverImage(null); setCoverPreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Content <span className="text-red-400">*</span>
          </label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Publishing…' : 'Publish Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
