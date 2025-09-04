import { useState } from 'react';
import { DefaultColorStyle, TldrawEditor as _ } from '@tldraw/tldraw';
import { Button } from '../ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <Button
      size={isMobile ? 'xs' : 'sm'}
      variant="vidext"
      onClick={() => {
        const previousSelection = [...editor.getSelectedShapeIds()];
        editor.selectAll();

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
  );
}
