'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/app/lib/utils';

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
const HoverCardPortal = HoverCardPrimitive.Portal;

function HoverCardContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPortal>
      <HoverCardPrimitive.Content
        side="bottom"
        align="center"
        collisionPadding={6}
        className={cn(
          'z-50 w-auto max-w-xs rounded-md border bg-background p-2 text-sm text-foreground shadow-lg',
          className
        )}
        {...props}
      >
        {children}
        <HoverCardPrimitive.Arrow className="fill-background" />
      </HoverCardPrimitive.Content>
    </HoverCardPortal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
