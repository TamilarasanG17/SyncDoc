# SyncDoc — Collaborative Document Engine with AST Conflict Resolution

This repo implements **Weeks 1–3** of the SyncDoc project plan from the
Infotact MERN-stack project document, plus a full visual identity for the
frontend.

| Week | Backend | Frontend |
|------|---------|----------|
| 1 | AST Modeling: recursive Mongoose schemas for document structural nodes, with recursive pre-save hooks tracing block relationships | Editor Foundations: React UI for browsing documents, base components for block-level rendering |
| 2 | CRDT Integration: WebSocket sync server built on Yjs, with localized operational block-locking | Sync Implementation: client connects to the Yjs WebSocket, renders live collaborative state and presence indicators |
| 3 | Transformation Engine: AST → Markdown / HTML / PDF export pipeline | Block Management: atomic per-block cursor & selection tracking (external store), move/retype/delete commands via context, live "gutter" collaboration indicator |

Week 4 (DOMPurify security hardening, CI/CD, final polish) is **not**
included in this drop.

## Design system

The UI is built around one signature idea: a **live gutter rail** on the
left edge of every block that lights up in a collaborator's color the
instant they focus it — a direct, literal expression of the CRDT +
locking machinery underneath, styled like a `git blame` margin rather than
a generic "someone is typing" toast.

- **Palette** — paper `#F7F8FA`, ink `#14171F`, muted ink `#4B5162`,
  hairline `#E2E5EA`, sync accent (teal) `#0E7C86`, lock accent (ochre)
  `#C97A2E`, secondary violet `#6E5ADB`.
- **Type** — Space Grotesk (display/headings), IBM Plex Sans (body), IBM
  Plex Mono (structural badges, timestamps, code) — a technical-writing
  pairing rather than a default sans stack.
- **Structure** — each block carries a small monospace badge
  (`PARAGRAPH` / `HEADING` / `CODE`) naming its real AST node type.
- **Navigation** — a persistent left sidebar (`components/Sidebar.tsx`)
  stays mounted across the library and the editor: brand mark, "All
  documents" / "Recently updated" nav (client-side filtered on
  `updatedAt`), and the current guest identity pinned to the bottom.
  Selecting a nav item always returns you to the library, so it doubles
  as the "back" affordance while you're inside a document.
- **Library** — search-as-you-type over document titles, a responsive
  card grid (`doc-grid`) with per-document color-coded icon chips
  (deterministic from the title, so a document keeps the same color
  every time you see it), relative timestamps ("3m ago", "2d ago"), and
  a dashed empty-state panel instead of a bare line of text.

All tokens live at the top of `frontend/src/styles.css`.

## Structure

```
syncdoc/
├── backend/                 # Node.js + Express + MongoDB + Yjs
│   └── src/
│       ├── config/db.js             connects Mongoose to MongoDB
│       ├── models/DocumentNode.js   recursive AST node schema + pre-save hook
│       ├── models/Document.js       top-level Document (AST root + Yjs snapshot)
│       ├── controllers/
│       │   ├── documentController.js  REST CRUD for documents
│       │   └── exportController.js    Markdown / HTML / PDF export endpoint
│       ├── routes/                  Express router
│       ├── utils/
│       │   ├── astUtils.js          Yjs blocks <-> AST tree conversion
│       │   ├── transformUtils.js    AST -> Markdown / HTML renderers
│       │   └── pdfExport.js         AST -> PDF renderer (pdfkit)
│       ├── sync/websocketServer.js  Yjs sync protocol + awareness + block locks
│       ├── sync/persistence.js      debounced Y.Doc -> MongoDB persistence
│       └── server.js                app entry point
└── frontend/                # React + TypeScript + Vite
    └── src/
        ├── types/document.ts        shared AST / document / peer types
        ├── api/documentsApi.ts      REST client (list/get/create/delete/export)
        ├── hooks/useYDoc.ts         Yjs client: sync + awareness + locks
        ├── state/blockSelectionStore.ts   atomic per-block cursor/selection store
        ├── context/BlockManagementContext.tsx  move/retype/delete commands
        ├── utils/format.ts            relative time, deterministic doc-icon colors
        ├── styles.css                design tokens + component styles
        ├── components/Sidebar.tsx     persistent nav: brand, sections, user chip
        ├── components/DocumentList.tsx        document library (search + grid)
        └── components/Editor/
            ├── EditorContainer.tsx  wires the hook + context to the block UI
            ├── BlockRenderer.tsx    editable block: gutter, badge, toolbar
            └── PresenceBar.tsx      connection status + collaborator avatars
```

## How the pieces fit together

- **AST Database (Week 1).** Every document is stored in MongoDB as a
  `Document` with a recursive `root` AST node (`models/DocumentNode.js`).
  The schema embeds itself (`children: [documentNodeSchema]`), and a
  `pre('save')` hook walks the whole tree on every save, assigning
  `nodeId`s and re-deriving each node's `parentId`/`order` — the "deep
  pre-save hook validation" called out in the spec.

- **Synchronization Engine (Week 2).** `sync/websocketServer.js` is a
  hand-rolled Yjs sync server. Each open document becomes a `WSSharedDoc`
  "room": a `Y.Doc` plus a `ws` connection set plus a Yjs `Awareness`
  instance for presence. Documents are lazily hydrated from Mongo
  (`sync/persistence.js`) the first time someone opens them, and edits
  are periodically written back both as a binary Yjs snapshot and as a
  freshly re-derived AST tree.

- **Localized operational block-locking (Week 2).** A soft, advisory
  lock per block (`WSSharedDoc.locks`), broadcast as a custom
  `MESSAGE_LOCK` frame. When a user focuses a block the client asks the
  server to acquire the lock; if granted, every other client's gutter
  rail lights up in that user's color and the block greys out with a
  "✏ X is editing" chip. Locks auto-expire (`LOCK_TTL_MS`).

- **Transformation Engine (Week 3).** `utils/transformUtils.js` walks the
  AST tree into Markdown or a standalone HTML document; `utils/pdfExport.js`
  walks the same tree into a PDF using `pdfkit` (pure JS, no headless
  browser needed). `GET /api/documents/:id/export/:format` (format =
  `markdown` | `html` | `pdf`) serves the result with a `Content-Disposition`
  header; the frontend's "Export ▾" menu fetches it as a blob and triggers
  a browser download.

- **Block Management (Week 3, frontend).** `state/blockSelectionStore.ts`
  is a tiny external store (`useSyncExternalStore`) keyed by block ID:
  each block subscribes only to its own cursor/selection, so moving a
  caret in one block never re-renders any sibling block — "update
  specific AST nodes on screen" taken literally, rather than Week 2's
  deep-observe-and-rerender-everything approach. `context/BlockManagementContext.tsx`
  carries move-up/move-down/retype/delete commands down to each row
  without prop drilling; `BlockRenderer` exposes them as a hover toolbar.

## Running it locally

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local `mongod` or Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI if needed
npm install
npm run dev                # http://localhost:4000, ws sync at /sync
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Open the frontend URL in two browser windows side by side, create a
document, open it in both, and start typing — edits, presence avatars,
gutter colors, and block locks all sync live between them. Use the
"Export ▾" menu in the editor toolbar to download the current document
as Markdown, HTML, or PDF.

## Load-testing / review checkpoints (per the project doc)

- **Mid-Project Review** targets for Week 2: present the Markdown→AST
  mapping via `astUtils.js`/`transformUtils.js`, and manually verify
  conflict resolution by opening the same document from ~10 browser tabs
  and editing different blocks simultaneously — Yjs's CRDT merge plus the
  lock banner should keep every edit intact with no corrupted local state.
- **Week 3 checkpoint**: export the same document to all three formats
  and confirm heading levels, code blocks, and list items all survive the
  round trip through `astToMarkdown` / `astToHtml` / `astToPdfBuffer`.

