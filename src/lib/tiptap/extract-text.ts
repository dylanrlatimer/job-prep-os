import type { JSONContent } from '@tiptap/core';

export function extractPlainText(doc: JSONContent, maxLength = 120): string {
  const parts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === 'text' && node.text) {
      parts.push(node.text);
    }
    if (node.content) {
      node.content.forEach(walk);
    }
  }

  walk(doc);
  const full = parts.join(' ').trim();
  return full.length > maxLength ? `${full.slice(0, maxLength)}…` : full;
}
