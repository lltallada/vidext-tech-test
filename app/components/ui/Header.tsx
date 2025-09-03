'use client';

import { unstable_ViewTransition as ViewTransition } from 'react';
import { SvgVidextLogo } from '@/app/components/icons/SvgVidextLogo';
import Container from './Container';

export default function Header({
  children,
  showVidextLogo = true,
}: {
  children?: React.ReactNode;
  showVidextLogo?: boolean;
}) {
  return (
    <header className="bg-white py-3 md:py-5 border-b border-dashed border-gray-200 relative z-10">
      <Container className="flex items-center justify-between">
        {showVidextLogo && (
          <SvgVidextLogo
            width={102}
            height={24}
            className="md:scale-125 md:ml-4"
          />
        )}
        {children}
      </Container>
    </header>
  );
}
