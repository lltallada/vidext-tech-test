'use client';

import TldrawEditor from './TldrawEditor';
import useTldrawEditor from '../../hooks/useTldrawEditor';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useEditor, TLUiComponents, DefaultColorStyle } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useState } from 'react';
import { Button } from '../ui/button';

type Props = {
  designId: string;
  initialSnapshot: unknown | null;
};

export default function TldrawPage({ designId, initialSnapshot }: Props) {
  const { status, handleReady } = useTldrawEditor(designId, initialSnapshot);

  function customTldrawHeader() {
    const editor = useEditor();
    type TldrawColor =
      | 'black'
      | 'white'
      | 'grey'
      | 'light-violet'
      | 'violet'
      | 'blue'
      | 'light-blue'
      | 'yellow'
      | 'orange'
      | 'green'
      | 'light-green'
      | 'light-red'
      | 'red';

    const [currentColor, setCurrentColor] = useState<TldrawColor | null>(null);

    const colors: TldrawColor[] = [
      'black',
      'white',
      'grey',
      'light-violet',
      'violet',
      'blue',
      'light-blue',
      'yellow',
      'orange',
      'green',
      'light-green',
      'light-red',
      'red',
    ];

    const pickRandom = () => {
      if (colors.length === 0) return null;
      let next = colors[Math.floor(Math.random() * colors.length)];
      if (next === currentColor && colors.length > 1) {
        const others = colors.filter(c => c !== currentColor);
        next = others[Math.floor(Math.random() * others.length)];
      }
      return next;
    };

    async function translateTexts(
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

    function getShapeText(s: any): string {
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
    function makeRichTextDoc(text: string) {
      const paragraphs = String(text).split(/\r?\n/);
      return {
        type: 'doc',
        content: paragraphs.map(line => ({
          type: 'paragraph',
          content: line ? [{ type: 'text', text: line }] : undefined,
        })),
      };
    }

    // call for testing if desired

    return (
      <>
        <div
          className="absolute left-1 top-12"
          style={{ pointerEvents: 'all' }}
        >
          <Button size="sm" variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft size={16} className="mr-1" />
              Volver
            </Link>
          </Button>
        </div>
        <div
          className="absolute right-42 top-2"
          style={{ pointerEvents: 'all' }}
        >
          <Button
            size="sm"
            variant="vidext"
            onClick={() => {
              const previousSelection = [...editor.getSelectedShapeIds()];
              editor.selectAll();

              const selectedIds = editor.getSelectedShapeIds();
              console.log(selectedIds, 'selected IDs Randomize button');

              const nextColor = pickRandom();
              if (nextColor) {
                editor.setStyleForSelectedShapes(DefaultColorStyle, nextColor);
                editor.setStyleForNextShapes(DefaultColorStyle, nextColor);
                setCurrentColor(nextColor);
              }

              editor.setSelectedShapes(previousSelection);
            }}
          >
            Randomize colors
          </Button>
        </div>
        <div
          className="absolute right-80 top-2"
          style={{ pointerEvents: 'all' }}
        >
          <Button
            size="sm"
            onPointerDown={e => e.preventDefault()}
            onClick={async () => {
              const selectedShapes = editor.getSelectedShapes();
              if (!selectedShapes?.length) return;

              const shapesWithText = selectedShapes.filter(
                (s: any) => s.type === 'text' || s.type === 'note'
              );
              if (!shapesWithText.length) {
                console.log('no text selected');
                return;
              }

              // 1) collect texts
              const texts = shapesWithText.map(getShapeText);
              const targetLang = 'en'; // <- or drive this from UI/state

              try {
                // 2) translate
                const translations = await translateTexts(texts, targetLang);

                // 3) apply
                editor.run(() => {
                  editor.updateShapes(
                    shapesWithText.map((s: any, i: number) => ({
                      id: s.id,
                      type: s.type,
                      props: {
                        ...s.props,
                        richText: makeRichTextDoc(translations[i]),
                      },
                    }))
                  );
                });
              } catch (e) {
                console.error('translation failed', e);
              }
            }}
          >
            Translate with AI
          </Button>
        </div>

        <div
          className="rounded-b-xl flex items-center justify-center absolute top-3 right-1/2 w-24 translate-x-[50%]"
          style={{
            pointerEvents: 'all',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-25 font-light">
              {status === 'idle' && ' '}
              {status === 'saving' && (
                <LoaderCircle
                  size={14}
                  className="inline-block animate-spin ml-1"
                />
              )}
              {status === 'saved' && 'Saved!'}
              {status === 'error' && 'Error'}
            </span>
          </div>
        </div>
      </>
    );
  }

  const components: TLUiComponents = {
    TopPanel: customTldrawHeader,
  };

  return (
    <main className="h-dvh relative flex-1">
      <TldrawEditor onEditorReady={handleReady} components={components} />
    </main>
  );
}
