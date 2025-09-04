export async function translateTexts(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLang }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Translate failed');
  return data.translations as string[];
}

export function getShapeText(s: any): string {
  const rt = s?.props?.richText;
  if (rt?.type === 'doc' && Array.isArray(rt.content)) {
    return rt.content
      .flatMap(
        (n: any) =>
          n?.content?.map((c: any) =>
            c?.type === 'text' ? c.text ?? '' : ''
          ) ?? []
      )
      .join('\n');
  }
  return s?.props?.text ?? '';
}

// Build a minimal richText doc from plain text (keeps newlines as paragraphs)
export function makeRichTextDoc(text: string) {
  const paragraphs = String(text).split(/\r?\n/);
  return {
    type: 'doc',
    content: paragraphs.map(line => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : undefined,
    })),
  };
}
