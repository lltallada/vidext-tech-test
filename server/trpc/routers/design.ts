import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { memoryDb } from '../db/memory';
import { TRPCError } from '@trpc/server';

export const designRouter = router({
  save: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        snapshot: z.unknown(),
      })
    )
    .mutation(({ input }) => {
      try {
        const rec = memoryDb.save(input.id, input.snapshot);
        return { ok: true, updatedAt: rec.updatedAt };
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save design',
        });
      }
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      try {
        const rec = memoryDb.get(input.id);
        if (!rec) {
          return { found: false, snapshot: null, updatedAt: null };
        }
        return {
          found: true,
          snapshot: rec.snapshot,
          updatedAt: rec.updatedAt,
        };
      } catch (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to read design',
        });
      }
    }),

  list: publicProcedure.input(z.void()).query(() => {
    try {
      return memoryDb.list();
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list designs',
      });
    }
  }),

  delete: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      try {
        const ok = memoryDb.delete(input.id);
        if (!ok) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Design with id "${input.id}" not found`,
          });
        }
        return { ok: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete design',
        });
      }
    }),
});
