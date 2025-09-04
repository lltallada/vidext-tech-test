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
import { Trash } from 'lucide-react';
import type { Row } from './DrawListingItem';

export default function DeleteDrawDialog({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const utils = trpc.useContext();

  const deleteMutation = trpc.design.delete.useMutation({
    onMutate: async ({ id: deletingId }: { id: string }) => {
      await utils.design.list.cancel();
      const previous = utils.design.list.getData() as Row[] | undefined;
      utils.design.list.setData(undefined, old =>
        old ? old.filter((r: Row) => r.id !== deletingId) : old
      );
      return { previous } as { previous?: Row[] | undefined };
    },
    onError: (
      _err: unknown,
      _vars: { id: string },
      context?: { previous?: Row[] | undefined }
    ) => {
      if (context?.previous) {
        utils.design.list.setData(undefined, context.previous);
      }
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
        <Button variant={'danger'} size="icon" type="button">
          <Trash size={18} />
        </Button>
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
