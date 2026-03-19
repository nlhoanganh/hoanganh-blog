import { useRef, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import toast from 'react-hot-toast';
import { uploadImage } from '../../api/imageApi';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function MarkdownEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    const toastId = toast.loading('Uploading image…');
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const markdown = `\n![${file.name}](${API_BASE}${url})\n`;
      onChange(value + markdown);
      toast.success('Image inserted!', { id: toastId });
    } catch {
      // Dismiss the loading toast; the axios interceptor already shows the error.
      toast.dismiss(toastId);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={450}
        preview="live"
      />

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>📎</span>
          {uploading ? 'Uploading…' : 'Insert Image'}
        </button>
        <span className="text-xs text-gray-400">
          Uploads image and inserts Markdown at the end of content
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImageUpload(file);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}
