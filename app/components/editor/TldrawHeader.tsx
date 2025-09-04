import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEditor } from '@tldraw/tldraw';
import { Button } from '../ui/button';

import RandomizeColorsButton from './RandomizeColorsButton';
import TranslateWithAIButton from './TranslateWithAIButton';
import HeaderStatus from './HeaderStatus';

type Props = {
  status: 'idle' | 'saving' | 'saved' | 'error';
};

export default function TldrawHeader({ status }: Props) {
  // useEditor must be invoked inside the editor context (TopPanel is rendered there)
  const editor = useEditor();

  return (
    <>
      <div className="absolute left-1 top-12" style={{ pointerEvents: 'all' }}>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft size={16} className="mr-1" />
            Volver
          </Link>
        </Button>
      </div>

      <div
        className="absolute right-2 sm:right-42 top-2"
        style={{ pointerEvents: 'all' }}
      >
        <RandomizeColorsButton editor={editor} />
      </div>

      <div
        className="absolute right-2 sm:right-80 top-11 sm:top-2"
        style={{ pointerEvents: 'all' }}
      >
        <TranslateWithAIButton editor={editor} />
      </div>

      <div
        className="rounded-b-xl flex items-center justify-center absolute top-3 right-1/2 w-24 translate-x-[50%]"
        style={{ pointerEvents: 'all' }}
      >
        <HeaderStatus status={status} />
      </div>
    </>
  );
}
