import { unstable_ViewTransition as ViewTransition } from 'react';
import { SvgVidextLogo } from '@/app/components/icons/SvgVidextLogo';
import Container from './Container';

export default function Header() {
  return (
    <header className="bg-white py-5 border-b border-gray-200">
      <Container className="flex items-center">
        <ViewTransition name="vidext-logo">
          <SvgVidextLogo width={128} height={30} />
        </ViewTransition>
      </Container>
    </header>
  );
}
