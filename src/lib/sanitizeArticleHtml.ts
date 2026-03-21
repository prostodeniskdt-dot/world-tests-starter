import "server-only";
import sanitizeHtml, { type Attributes } from "sanitize-html";
import { isAllowedKnowledgeMediaUrl, normalizeKnowledgeMediaSrc } from "@/lib/knowledgeMediaUrl";

export { isAllowedKnowledgeMediaUrl } from "@/lib/knowledgeMediaUrl";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "blockquote",
    "code",
    "pre",
    "span",
    "hr",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "div",
    "colgroup",
    "col",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "class"],
    img: ["src", "alt", "width", "height"],
    span: ["class"],
    table: ["class"],
    thead: ["class"],
    tbody: ["class"],
    tfoot: ["class"],
    tr: ["class"],
    th: ["colspan", "rowspan", "style", "class", "data-colwidth"],
    td: ["colspan", "rowspan", "style", "class", "data-colwidth"],
    div: ["class"],
    colgroup: ["span"],
    col: ["span", "style"],
    p: ["style", "class"],
    h1: ["style", "class"],
    h2: ["style", "class"],
    h3: ["style", "class"],
    h4: ["style", "class"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      width: [/^\d+(?:px|%|rem|em)?$/],
      "min-width": [/^\d+(?:px|%|rem|em)?$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["https"],
    a: ["http", "https", "mailto"],
  },
  transformTags: {
    img: (tagName, attribs) => {
      const src = attribs.src || "";
      if (!isAllowedKnowledgeMediaUrl(src)) {
        return { tagName: "span", text: "", attribs: {} };
      }
      return {
        tagName,
        attribs: {
          src: normalizeKnowledgeMediaSrc(src),
          alt: attribs.alt || "",
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
        },
      };
    },
    div: (tagName, attribs) => {
      const cls = attribs.class || "";
      if (cls === "tableWrapper" || cls.split(/\s+/).includes("tableWrapper")) {
        return { tagName, attribs: { class: "tableWrapper" } };
      }
      const strip: Attributes = {};
      return { tagName: "span", text: " ", attribs: strip };
    },
  },
};

export function sanitizeArticleHtml(html: string): string {
  const raw = String(html || "").trim();
  if (!raw) return "";
  return sanitizeHtml(raw, SANITIZE_OPTIONS).trim();
}
