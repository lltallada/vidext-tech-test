import React from 'react';
import DrawsListing from '@/app/components/home/DrawsListing';
import Header from '@/app/components/ui/Header';
import Container from './components/ui/Container';
import NewDrawDialog from './components/home/NewDrawDialog';

export default function Page() {
  return (
    <main>
      <Header>
        <NewDrawDialog buttonText="New Design" />
      </Header>
      <section>
        <Container className="py-10">
          <DrawsListing />
        </Container>
      </section>
    </main>
  );
}
