'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';

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
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';

export default function NewDrawDialog({
  buttonText = 'New Design',
  buttonVariant = 'vidext',
}: {
  buttonText?: string;
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const [drawingName, setDrawingName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
          <DialogHeader className="gap-2 mb-4 text-left">
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
            <div className="flex justify-end items-center gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>

              <Link
                href={href}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (!trimmed) {
                    e.preventDefault();
                    setError('Please provide a name for the drawing.');
                  } else {
                    setIsLoading(true);
                  }
                }}
                className="inline-block"
              >
                <Button
                  type="button"
                  variant="vidext"
                  disabled={isLoading || !trimmed}
                >
                  {isLoading ? (
                    <>
                      Loading
                      <LoaderCircle size={14} className="animate-spin ml-2" />
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </Link>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
