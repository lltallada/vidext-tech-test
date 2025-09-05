# Vidext Tech Test

A minimal drawing editor built with **Next.js**, **tldraw**, **Tailwind + shadcn/ui**, and **tRPC + React Query**. It provides a clean editor page, type-safe APIs to **load/save drawings** and **auto-saving feature** after any change.

## Main features

- **Editor page (tldraw):** draw, select, and edit shapes.
- **Auto-save:** changes are debounced and saved via tRPC.
- **Temporal Persistence:** storage is in-memory for the test; drawings reset when the server restarts.
- **Type-safe API (tRPC):** `design.get`, `design.save`, `design.list`, `design.delete` backed by an in-memory store.
- **Shape action:** “Randomize colors” button updates selected shapes.
- **Drawings list:** view recent drawings with thumbnails and timestamps.
- **Optional AI translate:** translate selected text/note shapes to English (requires an API key).

## Run locally

1.  **Requirements:** Node 20+, npm.
2.  **Install:**

```bash
npm install
```

3.  **Environment (optional for AI):** create `.env.local`:

```
GOOGLE_GENAI_API_KEY=your_key_here
```

4.  **Dev server:**

```bash
npm run dev
```

Open http://localhost:3000

## Testing

This project includes a small, ready-to-run test suite using Vitest. The tests are fast and isolated; you can run them without a browser.

### What these tests cover (high level):

- **API contracts (tRPC):** input validation and the basic success/error paths for design.get, design.save, design.list, and design.delete.
- **Persistence behavior:** the in-memory store’s CRUD logic (upsert on save, correct updatedAt, and list ordering).
- **Auto-save logic:** debouncing/coalescing changes, skipping no-ops, and avoiding overlapping saves.

###Run tests locally

Install dependencies:

```bash
npm install
```

Run all tests once (CI-style):

```bash
npx vitest run
```
