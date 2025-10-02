'use client'

import 'react-quill/dist/quill.snow.css'

interface RichTextDisplayProps {
  content: string
  className?: string
}

/**
 * Component để hiển thị nội dung HTML từ Rich Text Editor
 * với styling phù hợp
 */
export default function RichTextDisplay({ content, className = '' }: RichTextDisplayProps) {
  return (
    <div className={`rich-text-display ${className}`}>
      <style jsx global>{`
        .rich-text-display {
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
        }

        .rich-text-display h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          color: #111827;
        }

        .rich-text-display h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          color: #111827;
        }

        .rich-text-display h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          color: #111827;
        }

        .rich-text-display h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0;
          color: #111827;
        }

        .rich-text-display h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.5em 0;
          color: #111827;
        }

        .rich-text-display h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2.33em 0;
          color: #111827;
        }

        .rich-text-display p {
          margin: 1em 0;
        }

        .rich-text-display ul,
        .rich-text-display ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        .rich-text-display li {
          margin: 0.5em 0;
        }

        .rich-text-display ul {
          list-style-type: disc;
        }

        .rich-text-display ol {
          list-style-type: decimal;
        }

        .rich-text-display blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
          font-style: italic;
        }

        .rich-text-display code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .rich-text-display pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 16px;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 16px 0;
        }

        .rich-text-display pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        .rich-text-display img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 16px 0;
        }

        .rich-text-display a {
          color: #2563eb;
          text-decoration: underline;
        }

        .rich-text-display a:hover {
          color: #1d4ed8;
        }

        .rich-text-display strong {
          font-weight: bold;
        }

        .rich-text-display em {
          font-style: italic;
        }

        .rich-text-display u {
          text-decoration: underline;
        }

        .rich-text-display s {
          text-decoration: line-through;
        }

        .rich-text-display .ql-align-center {
          text-align: center;
        }

        .rich-text-display .ql-align-right {
          text-align: right;
        }

        .rich-text-display .ql-align-justify {
          text-align: justify;
        }

        .rich-text-display .ql-indent-1 {
          padding-left: 3em;
        }

        .rich-text-display .ql-indent-2 {
          padding-left: 6em;
        }

        .rich-text-display .ql-indent-3 {
          padding-left: 9em;
        }

        .rich-text-display .ql-indent-4 {
          padding-left: 12em;
        }

        .rich-text-display .ql-indent-5 {
          padding-left: 15em;
        }

        .rich-text-display .ql-indent-6 {
          padding-left: 18em;
        }

        .rich-text-display .ql-indent-7 {
          padding-left: 21em;
        }

        .rich-text-display .ql-indent-8 {
          padding-left: 24em;
        }

        .rich-text-display sub {
          vertical-align: sub;
          font-size: smaller;
        }

        .rich-text-display sup {
          vertical-align: super;
          font-size: smaller;
        }

        /* Video embed */
        .rich-text-display iframe {
          max-width: 100%;
          border-radius: 0.375rem;
          margin: 16px 0;
        }

        /* Tables */
        .rich-text-display table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }

        .rich-text-display table td,
        .rich-text-display table th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
        }

        .rich-text-display table th {
          background: #f3f4f6;
          font-weight: bold;
          text-align: left;
        }
      `}</style>
      
      <div 
        className="ql-editor" 
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

