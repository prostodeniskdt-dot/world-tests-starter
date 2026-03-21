"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link2,
  ImageIcon,
  Table2,
  Trash2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function KnowledgeEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Текст статьи…",
}: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Underline,
      TableKit.configure({
        table: { resizable: false },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none min-h-[280px] px-3 py-2 focus:outline-none prose-zinc knowledge-editor-content",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const cur = editor.getHTML();
    if (value !== cur) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Ссылка (URL)", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor || disabled) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/knowledge/upload-image", {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        });
        const data = await res.json();
        if (data.ok && data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        } else {
          alert(data.error || "Не удалось загрузить изображение");
        }
      } catch {
        alert("Ошибка сети при загрузке");
      }
    };
    input.click();
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 min-h-[320px] animate-pulse" />
    );
  }

  const Btn = ({
    onClick,
    active,
    children,
    title,
    btnDisabled,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
    btnDisabled?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      onMouseDown={(e) => {
        if (disabled || btnDisabled) return;
        // Иначе фокус уходит с contenteditable и сбрасывается выделение — команды не к чему применить
        e.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled || btnDisabled}
      className={`p-2 rounded-md border text-sm ${
        active
          ? "bg-primary-50 border-primary-300 text-primary-800"
          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );

  return (
    <div className="knowledge-editor-root rounded-lg border border-zinc-300 overflow-hidden bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-200 bg-zinc-50">
        <Btn
          title="Жирный"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn
          title="Курсив"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn
          title="Подчёркивание"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Btn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <Btn
          title="Выровнять влево"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft className="h-4 w-4" />
        </Btn>
        <Btn
          title="По центру"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter className="h-4 w-4" />
        </Btn>
        <Btn
          title="Вправо"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight className="h-4 w-4" />
        </Btn>
        <Btn
          title="По ширине"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
        >
          <AlignJustify className="h-4 w-4" />
        </Btn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <Btn
          title="Заголовок 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn
          title="Заголовок 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Btn
          title="Маркированный список"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </Btn>
        <Btn
          title="Нумерованный список"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn
          title="Цитата"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </Btn>
        <Btn
          title="Горизонтальная линия"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Btn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <Btn
          title="Таблица 3×3 (с шапкой)"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table2 className="h-4 w-4" />
        </Btn>
        <Btn
          title="Удалить таблицу"
          onClick={() => editor.chain().focus().deleteTable().run()}
          btnDisabled={!editor.can().deleteTable()}
        >
          <Trash2 className="h-4 w-4" />
        </Btn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <Btn title="Ссылка" onClick={setLink} active={editor.isActive("link")}>
          <Link2 className="h-4 w-4" />
        </Btn>
        <Btn title="Изображение" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <Btn title="Отменить" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </Btn>
        <Btn title="Повторить" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
