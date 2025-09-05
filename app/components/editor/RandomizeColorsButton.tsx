import { DefaultColorStyle, TldrawEditor as _ } from '@tldraw/tldraw';
import { Button } from '../ui/button';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/app/components/ui/hover-card';
import { useEffect, useRef, useState } from 'react';

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

const COLORS: TldrawColor[] = [
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

function pickRandom(current: TldrawColor | null) {
  if (COLORS.length === 0) return null;
  let next = COLORS[Math.floor(Math.random() * COLORS.length)];
  if (next === current && COLORS.length > 1) {
    const others = COLORS.filter(c => c !== current);
    next = others[Math.floor(Math.random() * others.length)];
  }
  return next;
}

export default function RandomizeColorsButton({ editor }: { editor: any }) {
  const [current, setCurrent] = useState<TldrawColor | null>(null);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const lastOpenedByClick = useRef(false);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <HoverCard
      open={open}
      onOpenChange={next => {
        if (next) {
          if (lastOpenedByClick.current) setOpen(true);
        } else {
          setOpen(false);
          lastOpenedByClick.current = false;
        }
      }}
    >
      <HoverCardTrigger asChild>
        <Button
          size={isMobile ? 'xs' : 'sm'}
          variant="vidext"
          onClick={() => {
            const previousSelection = [...editor.getSelectedShapeIds()];
            editor.selectAll();

            console.log(editor.getSelectedShapes());

            if (editor.getSelectedShapes().length === 0) {
              lastOpenedByClick.current = true;
              setOpen(true);
              if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              timeoutRef.current = window.setTimeout(() => {
                setOpen(false);
                lastOpenedByClick.current = false;
              }, 2500);
              editor.setSelectedShapes(previousSelection);
              return;
            }

            const next = pickRandom(current);
            if (next) {
              editor.setStyleForSelectedShapes(DefaultColorStyle, next);
              editor.setStyleForNextShapes(DefaultColorStyle, next);
              setCurrent(next);
            }

            editor.setSelectedShapes(previousSelection);
          }}
        >
          Color randomizer
        </Button>
      </HoverCardTrigger>

      <HoverCardContent>
        <div className="px-2 py-1">No shapes found :(</div>
      </HoverCardContent>
    </HoverCard>
  );
}
