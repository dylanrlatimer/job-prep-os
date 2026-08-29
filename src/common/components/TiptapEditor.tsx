'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { JSONContent } from '@tiptap/core';
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, Code, Terminal, Quote, Minus, Undo2, Redo2, Table2, PlusSquare, MinusSquare, Trash2 } from 'lucide-react';
import { TableKit } from '@tiptap/extension-table';
import { cn } from '@/lib/cn';

export type TiptapEditorRef = {
  getJSON: () => JSONContent;
  isEmpty: () => boolean;
};

type TiptapEditorProps = {
  initialContent: JSONContent | null;
  onEditorReady?: (json: JSONContent) => void;
  onUpdate?: () => void;
  id?: string;
  disabled?: boolean;
  variant?: 'full' | 'inline';
};

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type='button'
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-6 cursor-pointer items-center justify-center rounded-sm transition-colors',
        'text-muted-foreground hover:bg-card-muted hover:text-foreground',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active && 'bg-card-muted text-foreground',
      )}>
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className='mx-0.5 h-4 w-px shrink-0 bg-border' />;
}

const emptyDocument: JSONContent = { type: 'doc', content: [] };

const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(function TiptapEditor(
  { initialContent, onEditorReady, onUpdate, id, disabled, variant = 'full' },
  ref,
) {
  const isInline = variant === 'inline';
  const onEditorReadyRef = useRef(onEditorReady);
  onEditorReadyRef.current = onEditorReady;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const extensions = useMemo(() => {
    if (isInline) {
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
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TableKit,
    ];
  }, [isInline]);

  const editor = useEditor({
    extensions,
    content: initialContent ?? '',
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        id: id ?? '',
        class: cn(
          'px-3 text-sm leading-relaxed text-foreground focus:outline-none',
          isInline ? 'min-h-[2.5rem] py-2' : 'min-h-[9rem] py-2.5',
        ),
      },
    },
    onCreate({ editor: createdEditor }) {
      onEditorReadyRef.current?.(createdEditor.getJSON());
    },
    onUpdate() {
      onUpdateRef.current?.();
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getJSON: () => editor?.getJSON() ?? emptyDocument,
      isEmpty: () => editor?.isEmpty ?? true,
    }),
    [editor],
  );

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-sm border border-input bg-card transition-colors focus-within:border-tertiary-foreground focus-within:outline-none',
        disabled && 'opacity-60',
      )}>
      {!isInline ? (
        <div className={cn('flex flex-wrap items-center gap-0.5 border-b border-border bg-card-muted px-2 py-1.5', disabled && 'pointer-events-none')}>
          <ToolbarButton title='Bold' onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} disabled={!editor}>
            <Bold size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton title='Italic' onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} disabled={!editor}>
            <Italic size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Strikethrough'
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            active={editor?.isActive('strike')}
            disabled={!editor}>
            <Strikethrough size={13} strokeWidth={2} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title='Heading 2'
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor}>
            <Heading2 size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Heading 3'
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive('heading', { level: 3 })}
            disabled={!editor}>
            <Heading3 size={13} strokeWidth={2} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title='Bullet list'
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            disabled={!editor}>
            <List size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Ordered list'
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            disabled={!editor}>
            <ListOrdered size={13} strokeWidth={2} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title='Inline code' onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} disabled={!editor}>
            <Code size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Code block'
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            active={editor?.isActive('codeBlock')}
            disabled={!editor}>
            <Terminal size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Blockquote'
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote')}
            disabled={!editor}>
            <Quote size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton title='Horizontal rule' onClick={() => editor?.chain().focus().setHorizontalRule().run()} disabled={!editor}>
            <Minus size={13} strokeWidth={2} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            title='Insert table'
            onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            disabled={!editor}>
            <Table2 size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Add row below'
            onClick={() => editor?.chain().focus().addRowAfter().run()}
            disabled={!editor?.isActive('table')}>
            <PlusSquare size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Delete row'
            onClick={() => editor?.chain().focus().deleteRow().run()}
            disabled={!editor?.isActive('table')}>
            <MinusSquare size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton
            title='Add column right'
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
            disabled={!editor?.isActive('table')}>
            <PlusSquare size={13} strokeWidth={2} className='rotate-90' />
          </ToolbarButton>
          <ToolbarButton
            title='Delete column'
            onClick={() => editor?.chain().focus().deleteColumn().run()}
            disabled={!editor?.isActive('table')}>
            <MinusSquare size={13} strokeWidth={2} className='rotate-90' />
          </ToolbarButton>
          <ToolbarButton
            title='Delete table'
            onClick={() => editor?.chain().focus().deleteTable().run()}
            disabled={!editor?.isActive('table')}>
            <Trash2 size={13} strokeWidth={2} />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title='Undo' onClick={() => editor?.chain().focus().undo().run()} disabled={!editor || !editor.can().undo()}>
            <Undo2 size={13} strokeWidth={2} />
          </ToolbarButton>
          <ToolbarButton title='Redo' onClick={() => editor?.chain().focus().redo().run()} disabled={!editor || !editor.can().redo()}>
            <Redo2 size={13} strokeWidth={2} />
          </ToolbarButton>
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
});

export default TiptapEditor;
