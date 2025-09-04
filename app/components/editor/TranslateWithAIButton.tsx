import { Button } from '../ui/button';
import { makeRichTextDoc, getShapeText, translateTexts } from './tldrawHelpers';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function TranslateWithAIButton({ editor }: { editor: any }) {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <Button
      variant="ai"
      size={isMobile ? 'xs' : 'sm'}
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

        const texts = shapesWithText.map(getShapeText);
        const targetLang = 'en';

        try {
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
        }
      }}
    >
      Translate with AI
    </Button>
  );
}
