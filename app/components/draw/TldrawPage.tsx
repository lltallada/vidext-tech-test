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
  // moved editor logic to hook
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
      <div
        className="mt-2 rounded-b-xl flex items-center justify-center absolute top-0 right-1/2 w-[300px] translate-x-[calc(100%-100px)]"
        style={{
          pointerEvents: 'all',
        }}
      >
        <Button size="sm" variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft size={16} className="mr-1" />
            Volver
          </Link>
        </Button>
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
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-50">
            {status === 'saving' && (
              <LoaderCircle
                size={14}
                className="inline-block animate-spin ml-1"
              />
            )}
            {status === 'saved' && 'Saved :)'}
            {status === 'error' && 'Error'}
          </span>
        </div>
      </div>
    );
  }

  const components: TLUiComponents = {
    TopPanel: customTldrawHeader,
  };

  return (
    <div className="flex flex-col h-dvh">
      {/* HEADER 75px */}
      <Header showVidextLogo={false}>
        <div className="flex items-center gap-4">
          <Link href="/">
            <ArrowLeft size={24} />
          </Link>

          <span>
            Draw name: <span className="font-bold">{designId}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm opacity-50">
            {status === 'saving' && (
              <LoaderCircle
                size={14}
                className="inline-block animate-spin ml-1"
              />
            )}
            {status === 'saved' && 'Saved :)'}
            {status === 'error' && 'Error'}
          </span>
        </div>
      </Header>

      <main className="relative flex-1">
        <TldrawEditor onEditorReady={handleReady} components={components} />
      </main>
    </div>
  );
}
