import React from 'react';

export default function Container({
  children,
  className,
  ...rest
}: Readonly<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>>) {
  return (
    <div
      className={['max-w-5xl mx-auto px-4', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
