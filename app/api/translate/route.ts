// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function POST(req: Request) {
  try {
    const { texts, targetLang } = (await req.json()) as {
      texts: string[];
      targetLang: string;
    };

    if (!Array.isArray(texts) || !texts.length) {
      return NextResponse.json({ error: 'Missing texts[]' }, { status: 400 });
    }
    if (!targetLang) {
      return NextResponse.json(
        { error: 'Missing targetLang' },
        { status: 400 }
      );
    }

    const prompt = `
Translate each string to ${targetLang}.
Return ONLY a JSON array of strings, same length and order as input.
Keep line breaks. If an item is empty, return an empty string for that position.
Example output: ["...", "..."]`;

    // Ask for strict JSON back:
    const resp = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { text: JSON.stringify(texts) }],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Parse JSON array safely
    const raw = resp.response.text();
    let translations: string[];
    try {
      translations = JSON.parse(raw);
      if (!Array.isArray(translations)) throw new Error('Not an array');
      if (translations.length !== texts.length) {
        throw new Error('Length mismatch between input and output');
      }
    } catch (e) {
      // Fallback: if model wrapped JSON in code fences, try to extract
      const m = raw.match(/\[([\s\S]*)\]/);
      if (!m) throw e;
      translations = JSON.parse(`[${m[1]}]`);
    }

    return NextResponse.json({ translations });
  } catch (err: any) {
    console.error('Translate error', err);
    return NextResponse.json(
      { error: err?.message ?? 'Translate error' },
      { status: 500 }
    );
  }
}
