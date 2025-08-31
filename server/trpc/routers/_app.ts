import { router } from '../init'
import { designRouter } from './design'

export const appRouter = router({
  design: designRouter,
})

export type AppRouter = typeof appRouter
