import { z } from 'zod'
import { router, publicProcedure } from '../init'
import { memoryDb } from '..//db/memory'

export const designRouter = router({
  save: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        snapshot: z.unknown(), // JSON del tldraw
      })
    )
    .mutation(({ input }) => {
      const rec = memoryDb.save(input.id, input.snapshot)
      return { ok: true, updatedAt: rec.updatedAt }
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      const rec = memoryDb.get(input.id)
      return rec ? { found: true, snapshot: rec.snapshot, updatedAt: rec.updatedAt } : { found: false }
    }),
})
