'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  makeRichTextDoc,
  getShapeText,
  translateTexts,
} from '../../lib/tldrawHelpers';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/app/components/ui/hover-card';
import { LoaderCircle } from 'lucide-react';

export default function TranslateWithAIButton({ editor }: { editor: any }) {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [hintOpen, setHintOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const showHint = () => {
    setHintOpen(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setHintOpen(false), 2500);
  };

  const handleHoverCardOpenChange = (open: boolean) => {
    if (!open) setHintOpen(false);
  };

  return (
    <HoverCard open={hintOpen} onOpenChange={handleHoverCardOpenChange}>
      <HoverCardTrigger asChild>
        <Button
          variant="ai"
          size={isMobile ? 'xs' : 'sm'}
          onPointerDown={e => e.preventDefault()}
          onClick={async () => {
            const selectedShapes = editor.getSelectedShapes();
            if (!selectedShapes?.length) {
              showHint();
              return;
            }

            const shapesWithText = selectedShapes.filter(
              (s: any) => s.type === 'text' || s.type === 'note'
            );

            console.log('length', shapesWithText.length);

            if (!shapesWithText.length) {
              console.log('per aquí');
              showHint();
              return;
            }

            const texts = shapesWithText.map(getShapeText);
            const targetLang = 'en';

            try {
              setIsTranslating(true);
              const translations = await translateTexts(texts, targetLang);

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
            } finally {
              setIsTranslating(false);
            }
          }}
        >
          {isTranslating ? (
            <>
              <LoaderCircle className="animate-spin mr-2" size={16} />
              Translating...
            </>
          ) : (
            'English AI translator'
          )}
        </Button>
      </HoverCardTrigger>

      <HoverCardContent>
        <div className="px-2 py-1">
          Select a text shape first to translate it.
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
