import ReactMarkdown, { type Components } from "react-markdown";

function safeUrl(url: string) {
  const value = url.trim();
  if (!value || /[\u0000-\u001f\u007f\\]/u.test(value)) return undefined;
  if (/^(https?|mailto):/i.test(value)) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : undefined;
    } catch {
      return undefined;
    }
  }
  // Relative in-app paths and anchors are safe. Reject protocol-relative hosts
  // and any other explicit scheme (javascript:, data:, file:, and so on).
  if (value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) return undefined;
  return value;
}

const components: Components = {
  a({ href, children }) {
    if (!href) return <span>{children}</span>;
    const external = /^https?:/i.test(href);
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}</a>;
  },
  // Avoid remote image requests from private note previews. Keep the author's
  // alt text visible without contacting an external host.
  img({ alt }) {
    return alt ? <span className="markdown-image-alt">[Image: {alt}]</span> : null;
  },
};

export function MarkdownPreview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return <p className="preview-empty">Nothing to preview yet.</p>;
  return <div className="markdown-body"><ReactMarkdown skipHtml urlTransform={safeUrl} components={components}>{markdown}</ReactMarkdown></div>;
}
