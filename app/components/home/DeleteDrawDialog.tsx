'use client';

import React, { useState } from 'react';
import { trpc } from '@/server/trpc/client';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Trash } from 'lucide-react';

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
      await utils.design.get.cancel({ id: deletingId });

      const previousList = utils.design.list.getData() as unknown;
      const previousGet = utils.design.get.getData({
        id: deletingId,
      }) as unknown;

      utils.design.list.setData(undefined, old =>
        old ? (old as any).filter((r: any) => r.id !== deletingId) : old
      );

      utils.design.get.setData({ id: deletingId }, () => ({
        found: false,
        snapshot: null,
        updatedAt: null,
      }));

      return { previousList, previousGet } as {
        previousList?: unknown;
        previousGet?: unknown;
      };
    },
    onError: (
      _err: unknown,
      _vars: { id: string },
      context?: { previousList?: unknown; previousGet?: unknown }
    ) => {
      if (context?.previousList) {
        utils.design.list.setData(undefined, context.previousList as any);
      }
      if (context?.previousGet) {
        utils.design.get.setData({ id }, () => context.previousGet as any);
      }
    },
    onSettled: async () => {
      await utils.design.list.invalidate();
      await utils.design.get.invalidate({ id });
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
        <DialogHeader className="gap-2 mb-4 text-left">
          <DialogTitle>Are you absolutely sure?</DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
