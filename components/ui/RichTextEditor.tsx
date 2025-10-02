'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Import ReactQuill dynamically để tránh SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Nhập nội dung...',
  height = '400px'
}: RichTextEditorProps) {
  // Cấu hình toolbar với đầy đủ tính năng giống Word
  const modules = {
    toolbar: {
      container: [
        // Font và size
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        
        // Định dạng text cơ bản
        ['bold', 'italic', 'underline', 'strike'],
        
        // Màu chữ và màu nền
        [{ 'color': [] }, { 'background': [] }],
        
        // Script (superscript/subscript)
        [{ 'script': 'sub'}, { 'script': 'super' }],
        
        // Header
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        
        // List
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
        
        // Indent
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        
        // Canh lề
        [{ 'align': [] }],
        
        // Blockquote và code block
        ['blockquote', 'code-block'],
        
        // Link, image, video
        ['link', 'image', 'video'],
        
        // Clean formatting
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false
    }
  }

  // Định nghĩa formats được hỗ trợ
  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'header',
    'list',
    'bullet',
    'check',
    'indent',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video'
  ]

  return (
    <div className="rich-text-editor">
      <style jsx global>{`
        .rich-text-editor .quill {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
        }

        .rich-text-editor .ql-toolbar {
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background: #f9fafb;
          padding: 12px 8px;
        }

        .rich-text-editor .ql-container {
          border: 1px solid #d1d5db;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          font-size: 16px;
          font-family: inherit;
          min-height: ${height};
        }

        .rich-text-editor .ql-editor {
          min-height: ${height};
          padding: 16px;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
        }

        /* Styling cho toolbar buttons */
        .rich-text-editor .ql-toolbar button {
          padding: 4px 6px;
          margin: 2px;
        }

        .rich-text-editor .ql-toolbar button:hover {
          color: #2563eb;
        }

        .rich-text-editor .ql-toolbar button.ql-active {
          color: #2563eb;
        }

        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #374151;
        }

        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #374151;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #2563eb;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #2563eb;
        }

        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }

        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb;
        }

        /* Styling cho dropdowns */
        .rich-text-editor .ql-picker-label {
          color: #374151;
        }

        .rich-text-editor .ql-picker-label:hover {
          color: #2563eb;
        }

        .rich-text-editor .ql-picker-options {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        /* Styling cho nội dung editor */
        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }

        .rich-text-editor .ql-editor h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
        }

        .rich-text-editor .ql-editor h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
        }

        .rich-text-editor .ql-editor h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2.33em 0;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }

        .rich-text-editor .ql-editor li {
          margin: 0.5em 0;
        }

        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
        }

        .rich-text-editor .ql-editor code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }

        .rich-text-editor .ql-editor pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 16px;
          border-radius: 0.375rem;
          overflow-x: auto;
        }

        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
        }

        .rich-text-editor .ql-editor a {
          color: #2563eb;
          text-decoration: underline;
        }

        /* Focus state */
        .rich-text-editor .ql-container.ql-snow:focus-within {
          border-color: #2563eb;
          outline: none;
        }

        .rich-text-editor .ql-toolbar.ql-snow + .ql-container.ql-snow:focus-within {
          border-color: #2563eb;
        }
      `}</style>

      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}

