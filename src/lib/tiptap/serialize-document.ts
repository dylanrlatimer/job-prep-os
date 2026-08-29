import type { JSONContent } from '@tiptap/core';

export function serializeDocument(doc: JSONContent | null): string {
  return JSON.stringify(doc);
}

export function documentsEqual(left: JSONContent | null, right: JSONContent | null): boolean {
  return serializeDocument(left) === serializeDocument(right);
}
