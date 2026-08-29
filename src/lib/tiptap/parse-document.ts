import type { JSONContent } from '@tiptap/core';

export function parseTiptapDocument(value: unknown): JSONContent {
  return value as JSONContent;
}
