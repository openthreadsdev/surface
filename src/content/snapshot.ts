export interface PageSnapshot {
  url: string;
  title: string;
  timestamp: string;
  meta: Record<string, string>;
  textContent: string;
  skuHints: string[];
}

const SKU_PATTERNS = [
  /\b(?:SKU|sku|Sku)[:\s#-]*([A-Z0-9][\w-]{2,30})\b/,
  /\b(?:ASIN|asin)[:\s#-]*([A-Z0-9]{10})\b/,
  /\b(?:UPC|upc|EAN|ean|ISBN|isbn)[:\s#-]*([\d-]{8,17})\b/,
  /\b(?:Item|Model|Part)\s*(?:#|No\.?|Number)?[:\s-]*([A-Z0-9][\w-]{2,30})\b/,
];

export function extractMetaTags(doc: Document): Record<string, string> {
  const meta: Record<string, string> = {};
  const tags = doc.querySelectorAll(
    "meta[name], meta[property], meta[itemprop]",
  );
  tags.forEach((el) => {
    const key =
      el.getAttribute("name") ||
      el.getAttribute("property") ||
      el.getAttribute("itemprop") ||
      "";
    const content = el.getAttribute("content") || "";
    if (key && content) {
      meta[key] = content;
    }
  });
  return meta;
}

export function extractTextContent(doc: Document): string {
  const clone = doc.body.cloneNode(true) as HTMLElement;

  const removeTags = ["script", "style", "noscript", "svg", "iframe"];
  for (const tag of removeTags) {
    const els = clone.querySelectorAll(tag);
    els.forEach((el) => el.remove());
  }

  const text = clone.textContent || "";
  return text.replace(/\s+/g, " ").trim();
}

export function extractSkuHints(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of SKU_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, "g");
    let match: RegExpExecArray | null;
    while ((match = globalPattern.exec(text)) !== null) {
      if (match[1] && !matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
  }
  return matches;
}

export function captureSnapshot(doc: Document, url: string): PageSnapshot {
  const textContent = extractTextContent(doc);
  return {
    url,
    title: doc.title,
    timestamp: new Date().toISOString(),
    meta: extractMetaTags(doc),
    textContent,
    skuHints: extractSkuHints(textContent),
  };
}
