import { mergeAttributes } from '@tiptap/core';
import type { Extensions } from '@tiptap/core';
import { CodeBlock } from '@tiptap/extension-code-block';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { TableKit } from '@tiptap/extension-table';
import StarterKit from '@tiptap/starter-kit';
import { lowlight } from './lowlight';

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string | string[] };
  children?: HastNode[];
};

function classNameFromHast(node: HastNode): string | undefined {
  const className = node.properties?.className;
  if (Array.isArray(className) && className.length > 0) {
    return className.map(String).join(' ');
  }
  if (typeof className === 'string' && className.length > 0) {
    return className;
  }
  return undefined;
}

function hastToSpec(node: HastNode): unknown {
  if (node.type === 'text') {
    return node.value ?? '';
  }

  if (node.type !== 'element' || !node.tagName) {
    return '';
  }

  const className = classNameFromHast(node);
  const attrs = className ? { class: className } : {};
  const children = (node.children ?? []).map(hastToSpec);

  return children.length > 0 ? [node.tagName, attrs, ...children] : [node.tagName, attrs];
}

function highlightChildren(code: string, language: string | null): unknown[] {
  if (!code) return [];

  try {
    const tree = language && lowlight.registered(language) ? lowlight.highlight(language, code) : lowlight.highlightAuto(code);
    return (tree.children as HastNode[]).map(hastToSpec);
  } catch {
    return [code];
  }
}

const RendererCodeBlock = CodeBlock.extend({
  renderHTML({ node, HTMLAttributes }) {
    const language = typeof node.attrs.language === 'string' ? node.attrs.language : null;
    const languageClass = language ? `${this.options.languageClassPrefix}${language}` : null;

    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['code', languageClass ? { class: languageClass } : {}, ...highlightChildren(node.textContent, language)],
    ];
  },
});

function fullStarterKit() {
  return StarterKit.configure({
    heading: { levels: [2, 3] },
    codeBlock: false,
  });
}

export function getEditorExtensions(variant: 'full' | 'inline'): Extensions {
  if (variant === 'inline') {
    return [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
    ];
  }

  return [
    fullStarterKit(),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    TableKit,
  ];
}

export function getRendererExtensions(): Extensions {
  return [fullStarterKit(), RendererCodeBlock, TableKit];
}
