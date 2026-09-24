import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown subset for admin-edited pages:
 *   ## Heading / ### Subheading, paragraphs, "- " bullet lists,
 *   **bold**, and [links](/path or https://…).
 * Output is built from React elements — no raw HTML is ever injected.
 */

function safeHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^mailto:[^\s]+$/i.test(href) || /^tel:\+?[\d\s-]+$/i.test(href)) return href;
  try {
    const u = new URL(href);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function renderInline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${n++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else {
      const href = safeHref(m[3]);
      if (!href) out.push(m[2]);
      else if (href.startsWith("/")) out.push(<Link key={key} href={href}>{m[2]}</Link>);
      else out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ source, className = "prose-vj" }: { source: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k}>{renderInline(para.join(" "), k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const k = `ul${blocks.length}`;
      blocks.push(
        <ul key={k}>
          {list.map((item, i) => (
            <li key={i}>{renderInline(item, `${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushPara(); flushList();
      blocks.push(<h3 key={`h3${blocks.length}`}>{line.replace(/^###\s+/, "")}</h3>);
    } else if (/^##\s+/.test(line)) {
      flushPara(); flushList();
      blocks.push(<h2 key={`h2${blocks.length}`}>{line.replace(/^##\s+/, "")}</h2>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={className}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
