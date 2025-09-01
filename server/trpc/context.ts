export async function createContext() {
  return {}
}
export type Context = Awaited<typeof createContext>
