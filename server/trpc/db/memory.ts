type DesignRecord = {
  id: string;
  snapshot: unknown;
  updatedAt: number;
  thumbnail?: string;
};

const store = new Map<string, DesignRecord>();

export const memoryDb = {
  save(id: string, snapshot: unknown, thumbnail?: string) {
    const rec: DesignRecord = {
      id,
      snapshot,
      updatedAt: Date.now(),
      thumbnail,
    };
    store.set(id, rec);
    return rec;
  },
  get(id: string) {
    return store.get(id) ?? null;
  },
  list() {
    return Array.from(store.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(r => ({
        id: r.id,
        updatedAt: r.updatedAt,
        size:
          typeof r.snapshot === 'undefined'
            ? 0
            : JSON.stringify(r.snapshot).length,
        thumbnail: r.thumbnail,
      }));
  },
  delete(id: string) {
    return store.delete(id);
  },
};
