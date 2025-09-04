import { describe, it, expect, vi, beforeEach } from 'vitest';

// Dynamic import to get a fresh in-memory store every time
const loadDb = async () => {
  const mod = await import('@/server/trpc/db/memory');
  return mod.memoryDb as typeof import('@/server/trpc/db/memory').memoryDb;
};

describe('memoryDb', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('saves a new record with current timestamp', async () => {
    const memoryDb = await loadDb();
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    const rec = memoryDb.save('a', { x: 1 });
    expect(rec).toMatchObject({ id: 'a', snapshot: { x: 1 }, updatedAt: 1000 });

    const got = memoryDb.get('a');
    expect(got?.id).toBe('a');
    expect(got?.updatedAt).toBe(1000);
  });

  it('overwrites existing record and bumps updatedAt', async () => {
    const memoryDb = await loadDb();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    memoryDb.save('a', { x: 1 });

    vi.spyOn(Date, 'now').mockReturnValue(2000);
    memoryDb.save('a', { y: 2 });

    const got = memoryDb.get('a');
    expect(got?.snapshot).toEqual({ y: 2 });
    expect(got?.updatedAt).toBe(2000);
  });

  it('get returns undefined for missing id', async () => {
    const memoryDb = await loadDb();
    expect(memoryDb.get('missing')).toBeNull();
  });

  it('list returns empty for fresh store', async () => {
    const memoryDb = await loadDb();
    expect(memoryDb.list()).toEqual([]);
  });

  it('list is sorted by updatedAt descending', async () => {
    const memoryDb = await loadDb();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    memoryDb.save('a', { x: 1 });
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    memoryDb.save('b', { x: 2 });

    const rows = memoryDb.list();
    expect(rows.map(r => r.id)).toEqual(['b', 'a']);
    expect(rows[0].updatedAt).toBe(2000);
    expect(rows[1].updatedAt).toBe(1000);
  });

  it('size is 0 for undefined snapshot', async () => {
    const memoryDb = await loadDb();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    memoryDb.save('u', undefined);

    const rows = memoryDb.list();
    expect(rows[0]).toMatchObject({ id: 'u', size: 0 });
  });

  it('size equals JSON stringified length for arrays/objects/strings', async () => {
    const memoryDb = await loadDb();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    memoryDb.save('arr', ['a', 'b']);
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    memoryDb.save('obj', { a: 1, b: 2 });
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    memoryDb.save('str', 'hello');

    const rows = memoryDb.list().sort((a, b) => a.id.localeCompare(b.id));
    const sizeOf = (v: unknown) => JSON.stringify(v).length;

    expect(rows.find(r => r.id === 'arr')?.size).toBe(sizeOf(['a', 'b']));
    expect(rows.find(r => r.id === 'obj')?.size).toBe(sizeOf({ a: 1, b: 2 }));
    expect(rows.find(r => r.id === 'str')?.size).toBe(sizeOf('hello'));
  });

  it('delete returns true for existing id and removes it', async () => {
    const memoryDb = await loadDb();
    memoryDb.save('todelete', { ok: true });
    expect(memoryDb.delete('todelete')).toBe(true);
    expect(memoryDb.get('todelete')).toBeNull();
  });

  it('delete returns false for missing id', async () => {
    const memoryDb = await loadDb();
    expect(memoryDb.delete('nope')).toBe(false);
  });
});
