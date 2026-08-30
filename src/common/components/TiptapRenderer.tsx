import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { getRendererExtensions } from '@/lib/tiptap/extensions';

type TiptapRendererProps = {
  content: JSONContent;
  className?: string;
};

export default function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const html = generateHTML(content, getRendererExtensions());

  return <div className={`tiptap-content${className ? ` ${className}` : ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
