import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import type { JSONContent } from '@tiptap/core';

type TiptapRendererProps = {
  content: JSONContent;
  className?: string;
};

export default function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const html = generateHTML(content, [StarterKit.configure({ heading: { levels: [2, 3] } }), TableKit]);

  return <div className={`tiptap-content${className ? ` ${className}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
