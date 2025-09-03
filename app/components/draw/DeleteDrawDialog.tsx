'use client';

import { useState } from 'react';
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
import { trpc } from '@/server/trpc/client';

export default function DeleteDrawDialog({
  buttonText = 'New Design',
  buttonVariant = 'vidext',
  id,
}: {
  buttonText?: string;
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  id: string;
}) {
  const [visible, setVisible] = useState(true);
  const del = trpc.design.delete.useMutation();

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(`Segur que vols esborrar "${id}"?`);
    if (!confirmDelete) return;

    // Optimistic UI: hide immediately
    setVisible(false);
    try {
      const res = await del.mutateAsync({ id });
      if (!res.ok) {
        setVisible(true); // revert if not found
        alert('No s’ha pogut esborrar (no trobat).');
      }
    } catch (e) {
      setVisible(true); // revert on network/error
      alert('Error en esborrar.');
    }
  };

  if (!visible) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant}>{buttonText}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="gap-2 mb-4">
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone, your draw will be deleted.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(id);
            }}
            type="button"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
