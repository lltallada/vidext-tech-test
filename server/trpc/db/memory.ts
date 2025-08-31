type DesignRecord = {
  id: string
  snapshot: unknown
  updatedAt: number
}

const store = new Map<string, DesignRecord>()

export const memoryDb = {
  save(id: string, snapshot: unknown) {
    const rec = { id, snapshot, updatedAt: Date.now() }
    store.set(id, rec)
    return rec
  },
  get(id: string) {
    return store.get(id) ?? null
  },
}
