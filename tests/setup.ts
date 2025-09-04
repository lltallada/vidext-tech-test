// tests/setup.ts
import { afterEach, vi } from 'vitest';

// Ensure we always reset module cache between tests that rely on singletons
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});