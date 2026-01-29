'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Toolbar: headers, font, size, formatting, lists, color, align, link/image/video, table (custom), clean
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: [] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link', 'image', 'video'],
  ['clean'],
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content...',
  disabled = false,
  className = '',
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: { container: TOOLBAR_OPTIONS },
      clipboard: {
        // Preserve formatting when pasting from Word (fonts, sizes, colors, alignment, styles)
        matchVisual: true,
      },
    }),
    []
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'script',
    'color',
    'background',
    'align',
    'link',
    'image',
    'video',
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        }}
      />
      <style jsx global>{`
        .rich-text-editor .quill {
          background: hsl(var(--background));
        }
        .rich-text-editor .ql-container {
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 200px;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: hsl(var(--input));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .rich-text-editor .ql-editor table,
        .rich-text-editor .ql-editor .ql-table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .rich-text-editor .ql-editor td,
        .rich-text-editor .ql-editor th,
        .rich-text-editor .ql-editor .ql-table td,
        .rich-text-editor .ql-editor .ql-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.5em 0.75em;
          vertical-align: top;
        }
        .rich-text-editor .ql-editor th {
          font-weight: 600;
          background: hsl(var(--muted) / 0.5);
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: hsl(var(--input));
          background: hsl(var(--muted));
        }
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button:focus,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker-options {
          background: hsl(var(--background));
          border-color: hsl(var(--input));
        }
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow .ql-picker-item.ql-selected {
          color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
