'use client';

import React, { useState } from 'react';
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
  onClose,
}: {
  buttonText?: string;
  buttonVariant?: React.ComponentProps<typeof Button>['variant'];
  id: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const utils = trpc.useContext();

  const deleteMutation = trpc.design.delete.useMutation({
    onMutate: async ({ id: deletingId }: { id: string }) => {
      await utils.design.list.cancel();
      const previous = utils.design.list.getData();
      utils.design.list.setData(undefined, old =>
        old ? old.filter((r: any) => r.id !== deletingId) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous)
        utils.design.list.setData(undefined, context.previous);
    },
    onSettled: async () => {
      await utils.design.list.invalidate();
      onClose?.();
    },
  });

  const handleDelete = async () => {
    setVisible(false);
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (e) {
      setVisible(true);
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
              handleDelete();
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
