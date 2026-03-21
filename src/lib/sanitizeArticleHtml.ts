import "server-only";
import sanitizeHtml from "sanitize-html";
import { getS3PublicUrlPrefixes } from "@/lib/s3";

function normalizeSrc(src: string): string {
  try {
    const u = new URL(src);
    return u.href;
  } catch {
    return "";
  }
}

export function isAllowedKnowledgeMediaUrl(url: string | null | undefined): boolean {
  if (url == null || url === "") return true;
  const trimmed = String(url).trim();
  if (!trimmed) return true;
  const prefixes = getS3PublicUrlPrefixes();
  if (prefixes.length === 0) return false;
  const normalized = normalizeSrc(trimmed);
  if (!normalized.startsWith("https://")) return false;
  return prefixes.some((p) => normalized.startsWith(`${p}/`) || normalized === p);
}

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
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "class"],
    img: ["src", "alt", "width", "height"],
    span: ["class"],
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
          src: normalizeSrc(src),
          alt: attribs.alt || "",
          ...(attribs.width ? { width: attribs.width } : {}),
          ...(attribs.height ? { height: attribs.height } : {}),
        },
      };
    },
  },
};

export function sanitizeArticleHtml(html: string): string {
  const raw = String(html || "").trim();
  if (!raw) return "";
  return sanitizeHtml(raw, SANITIZE_OPTIONS).trim();
}
