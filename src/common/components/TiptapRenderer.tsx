import type { JSONContent } from '@tiptap/core';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { getRendererExtensions } from '@/lib/tiptap/extensions';

type TiptapRendererProps = {
  content: JSONContent;
  className?: string;
};

export default function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const element = renderToReactElement({
    extensions: getRendererExtensions(),
    content,
  });

  return <div className={`tiptap-content${className ? ` ${className}` : ''}`}>{element}</div>;
}
