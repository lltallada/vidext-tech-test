import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        ghost: 'bg-transparent hover:bg-accent/50',
        link: 'underline-offset-4 hover:underline text-primary',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        vidext: 'bg-vidext-yellow',
        ai: 'bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-900 text-white hover:opacity-95',
      },
      size: {
        default: 'h-10 py-2 px-4',
        xs: 'h-7 px-2 rounded-sm text-xs',
        sm: 'h-9 px-3 rounded-md text-sm',
        lg: 'h-11 px-8 rounded-md text-base',
        icon: ' h-auto w-auto aspect-square p-2 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp: React.ElementType = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
