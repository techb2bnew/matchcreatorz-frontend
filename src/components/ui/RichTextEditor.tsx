'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

// react-quill-new touches `document`, so it must be client-only (no SSR).
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="w-full border border-gray-200 rounded-2xl bg-gray-50 h-[140px] animate-pulse" />
  ),
});

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  label?: string;
  /** compact toolbar for short fields (bio, proposal); full for long content */
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Lightweight, MVP-friendly rich-text editor built on Quill (via react-quill-new).
 * Emits HTML. Use `variant="compact"` for short prose (bio, proposal),
 * `variant="full"` for long content (service/job description).
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  label,
  variant = 'full',
  className = '',
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar:
        variant === 'compact'
          ? [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
          : [
              [{ header: [2, 3, false] }],
              ['bold', 'italic', 'underline'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['link'],
              ['clean'],
            ],
    }),
    [variant],
  );

  const formats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'list', 'link'],
    [],
  );

  return (
    <div className={`mc-rte ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
      {/* scoped styling so the editor matches the app's rounded / soft look */}
      <style jsx global>{`
        .mc-rte .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #e5e7eb;
          background: #f9fafb;
        }
        .mc-rte .ql-container {
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #e5e7eb;
          background: #f9fafb;
          font-size: 0.875rem;
          min-height: 120px;
        }
        .mc-rte .ql-editor {
          min-height: 120px;
          line-height: 1.6;
        }
        .mc-rte .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .mc-rte:focus-within .ql-toolbar,
        .mc-rte:focus-within .ql-container {
          border-color: #e84545;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

/**
 * Render editor HTML safely as read-only content.
 * (Content originates from our own authenticated users; basic display use.)
 */
export function RichTextView({ html, className = '' }: { html?: string | null; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`prose prose-sm max-w-none text-gray-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
