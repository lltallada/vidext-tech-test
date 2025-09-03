'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function NewDrawDialog({
  buttonText = 'New Design',
  buttonVariant = 'vidext',
}: {
  buttonText?: string;
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const [drawingName, setDrawingName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDrawingName(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = drawingName.trim();
    if (!name) {
      setError('Please provide a name for the drawing.');
      return;
    }
    // keep programmatic navigation for Enter/submit
    router.push(`/draw/${encodeURIComponent(name)}`);
  };

  const trimmed = drawingName.trim();
  const href = trimmed ? `/draw/${encodeURIComponent(trimmed)}` : '#';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>{buttonText}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-2 mb-4">
            <DialogTitle>Drawing Info</DialogTitle>
            <DialogDescription>
              Please provide a name for your new drawing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 mb-4">
            <Input
              id="name-1"
              name="drawName"
              placeholder="Your drawing name"
              value={drawingName}
              onChange={handleInputChange}
              aria-invalid={!!error}
              required
            />
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>

            {/* Use Link for navigation but prevent it when invalid */}
            <Link
              href={href}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!trimmed) {
                  e.preventDefault();
                  setError('Please provide a name for the drawing.');
                }
              }}
              className="inline-block"
            >
              <Button type="button" variant="vidext">
                {/* keep type button to avoid form submit via click */}Continue
              </Button>
            </Link>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
