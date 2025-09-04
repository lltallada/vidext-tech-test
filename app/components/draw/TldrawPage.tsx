'use client';

import TldrawEditor from './TldrawEditor';
import useTldrawEditor from '../../hooks/useTldrawEditor';
import Header from '../ui/Header';
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
