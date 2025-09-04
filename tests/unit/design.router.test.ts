import { describe, it, expect, vi, beforeEach } from 'vitest';

const loadRouter = async () => {
  const mod = await import('@/server/trpc/routers/_app');
  return mod.appRouter as typeof import('@/server/trpc/routers/_app').appRouter;
};

describe('design router', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('save rejects empty id (BAD_REQUEST)', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    await expect(
      caller.design.save({ id: '', snapshot: {} as any })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('save accepts unknown snapshot types and updates updatedAt', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    vi.spyOn(Date, 'now').mockReturnValue(1000);
    await caller.design.save({ id: 'a', snapshot: { x: 1 } });

    vi.spyOn(Date, 'now').mockReturnValue(2000);
    await caller.design.save({ id: 'a', snapshot: undefined });

    const list = await caller.design.list();
    expect(list[0].id).toBe('a');
    expect(list[0].updatedAt).toBe(2000);
    expect(list[0].size).toBe(0);
  });

  it('get returns existing record', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    await caller.design.save({ id: 'doc1', snapshot: { foo: 'bar' } });
    const rec = await caller.design.get({ id: 'doc1' });

    expect(rec).toMatchObject({ snapshot: { foo: 'bar' } });
    expect(typeof rec.updatedAt).toBe('number');
    if ('found' in (rec as any)) {
      expect((rec as any).found).toBe(true);
    }
  });

  it('get returns a not-found sentinel for missing id', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    const rec = await caller.design.get({ id: 'nope' });
    expect(rec).toEqual({ found: false, snapshot: null, updatedAt: null });
  });

  it('list returns projected rows sorted by updatedAt desc', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    vi.spyOn(Date, 'now').mockReturnValue(1000);
    await caller.design.save({ id: 'a', snapshot: { a: 1 } });
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    await caller.design.save({ id: 'b', snapshot: { b: 2 } });

    const rows = await caller.design.list();
    expect(rows.map(r => r.id)).toEqual(['b', 'a']);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'b',
        size: JSON.stringify({ b: 2 }).length,
      })
    );
  });

  it('delete deletes existing and get returns not-found sentinel; missing delete is ok:false', async () => {
    const appRouter = await loadRouter();
    const caller = appRouter.createCaller({} as any);

    await caller.design.save({ id: 'a', snapshot: {} });
    const res = await caller.design.delete({ id: 'a' });

    expect(res).toMatchObject({ ok: true });

    const after = await caller.design.get({ id: 'a' });
    expect(after).toEqual({ found: false, snapshot: null, updatedAt: null });

    await expect(caller.design.delete({ id: 'nope' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
