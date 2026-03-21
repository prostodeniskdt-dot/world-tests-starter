"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
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
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

function stealFocusFromToolbar(e: React.MouseEvent | React.PointerEvent) {
  e.preventDefault();
}

type BtnProps = {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  btnDisabled?: boolean;
};

function ToolbarBtn({ onClick, active, children, title, disabled, btnDisabled }: BtnProps) {
  const off = Boolean(disabled || btnDisabled);
  return (
    <button
      type="button"
      title={title}
      tabIndex={-1}
      onMouseDown={(e) => {
        if (!off) stealFocusFromToolbar(e);
      }}
      onPointerDown={(e) => {
        if (!off) stealFocusFromToolbar(e);
      }}
      onClick={onClick}
      disabled={off}
      className={`p-2 rounded-md border text-sm ${
        active
          ? "bg-primary-50 border-primary-300 text-primary-800"
          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

const menuBarClass =
  "z-[70] flex flex-wrap gap-0.5 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg max-w-[min(100vw-2rem,420px)]";

function BubbleMenuInner({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      className={menuBarClass}
    >
      <ToolbarBtn
        title="Жирный"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Курсив"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Подчёркивание"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarBtn>
      <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
      <ToolbarBtn
        title="Маркированный список"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Нумерованный список"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Уровень списка — вправо"
        disabled={disabled}
        btnDisabled={!editor.can().sinkListItem("listItem")}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      >
        <IndentIncrease className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Уровень списка — влево"
        disabled={disabled}
        btnDisabled={!editor.can().liftListItem("listItem")}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      >
        <IndentDecrease className="h-4 w-4" />
      </ToolbarBtn>
    </BubbleMenu>
  );
}

function FloatingMenuInner({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  return (
    <FloatingMenu
      editor={editor}
      options={{ placement: "left-start", offset: 8, flip: { fallbackPlacements: ["right-start"] } }}
      className={menuBarClass}
      shouldShow={({ editor: ed }) => {
        if (!ed.isEditable || disabled || !ed.isFocused) return false;
        const { selection } = ed.state;
        if (!selection.empty) return false;
        const parent = selection.$from.parent;
        if (!parent.isTextblock || parent.type.spec.code) return false;
        const n = parent.type.name;
        return n === "paragraph" || n === "heading";
      }}
    >
      <ToolbarBtn
        title="Заголовок 2"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Заголовок 3"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Маркированный список"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Нумерованный список"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Уровень списка — вправо"
        disabled={disabled}
        btnDisabled={!editor.can().sinkListItem("listItem")}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      >
        <IndentIncrease className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Уровень списка — влево"
        disabled={disabled}
        btnDisabled={!editor.can().liftListItem("listItem")}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      >
        <IndentDecrease className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        title="Цитата"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="h-4 w-4" />
      </ToolbarBtn>
    </FloatingMenu>
  );
}

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
          "prose prose-sm sm:prose max-w-none min-h-[min(480px,52vh)] px-3 py-3 focus:outline-none prose-zinc knowledge-editor-content",
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
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 min-h-[min(400px,50vh)] animate-pulse" />
    );
  }

  return (
    <div className="knowledge-editor-root rounded-lg border border-zinc-300 overflow-hidden bg-white relative">
      <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-200 bg-zinc-50">
        <ToolbarBtn
          title="Жирный"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Курсив"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Подчёркивание"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <ToolbarBtn
          title="Выровнять влево"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="По центру"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Вправо"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="По ширине"
          disabled={disabled}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <ToolbarBtn
          title="Заголовок 2"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Заголовок 3"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Маркированный список"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Нумерованный список"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Уровень списка — вправо (вложенность)"
          disabled={disabled}
          btnDisabled={!editor.can().sinkListItem("listItem")}
          onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        >
          <IndentIncrease className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Уровень списка — влево"
          disabled={disabled}
          btnDisabled={!editor.can().liftListItem("listItem")}
          onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        >
          <IndentDecrease className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Цитата"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Горизонтальная линия"
          disabled={disabled}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <ToolbarBtn
          title="Таблица 3×3 (с шапкой)"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <Table2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Удалить таблицу"
          disabled={disabled}
          onClick={() => editor.chain().focus().deleteTable().run()}
          btnDisabled={!editor.can().deleteTable()}
        >
          <Trash2 className="h-4 w-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <ToolbarBtn title="Ссылка" disabled={disabled} onClick={setLink} active={editor.isActive("link")}>
          <Link2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Изображение" disabled={disabled} onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>
        <span className="w-px h-6 bg-zinc-200 self-center mx-0.5" aria-hidden />
        <ToolbarBtn title="Отменить" disabled={disabled} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Повторить" disabled={disabled} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      <div className="max-h-[min(720px,72vh)] overflow-y-auto overflow-x-hidden relative">
        <BubbleMenuInner editor={editor} disabled={disabled} />
        <FloatingMenuInner editor={editor} disabled={disabled} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
