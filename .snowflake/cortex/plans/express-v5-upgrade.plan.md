# Plan: Express v5 Upgrade

## Context

The project is on Express 4.22.2, TypeScript 4.9.5, and `@types/express` 4.17.x. The TS compilation error (`Module '"http"' has no default export` in socket.io) is caused by the missing `esModuleInterop` tsconfig flag — but since we're upgrading Express to v5, we'll address all breaking changes together.

## Breaking Changes Identified

### 1. TypeScript / tsconfig
- **socket.io** uses `import http from "http"` (ES module default import syntax). Without `esModuleInterop: true`, TypeScript rejects this. This is the error you're seeing now.
- TypeScript 4.9.5 is outdated; upgrading to 5.x ensures compatibility with newer type packages.

### 2. Express 5 Route Wildcards
Express 5 uses `path-to-regexp` v8 which requires **named** wildcards:
- `'/njsPC/*'` → `'/njsPC/*path'` (relayRoute.ts:16)
- `app.get('*', ...)` → `app.get('*path', ...)` (Server.ts:114, httpsRedirect)

### 3. Error Handler Typing
Express 5 is stricter about the 4-argument error middleware. The current `(error, req, res, next) => {}` needs explicit `ErrorRequestHandler` typing or explicit parameter types.

### 4. Deprecated `url.parse()`
`url.parse()` is deprecated in Node and was already discouraged. relayRoute.ts:129 uses it. Replacing with `new URL()` is straightforward.

### 5. Swapped Parameters Bug (pre-existing)
Server.ts:114 has `(res: express.Response, req: express.Request)` — the callback arguments are backwards (Express always passes `req, res, next`). Express 4 didn't catch this at runtime due to loose types; Express 5 types will flag it.

### 6. `req.ip` / `req.hostname` Changes
Express 5 makes `req.ip` return `undefined` instead of empty string when trust proxy is off. The code only uses these for logging, so no functional change needed — just awareness.

## Dependency Changes

| Package | Current | Target |
|---------|---------|--------|
| express | ^4.21.2 | ^5.2.1 |
| @types/express | ^4.17.23 | ^5.0.6 |
| typescript | ^4.9.5 | ^5.9.3 |
| @types/node | ^20.14.10 | ^22 (optional, for consistency) |

## Implementation Steps

### Step 1: Update package.json dependencies
```json
"express": "^5.2.1",
"@types/express": "^5.0.6",
"typescript": "^5.9.3"
```

### Step 2: Update tsconfig.json
Add `esModuleInterop: true` and `moduleResolution: "node"`. This fixes the socket.io error and enables natural default imports.

### Step 3: Fix route wildcards
```typescript
// relayRoute.ts
app.all('/njsPC/*path', async (req, res, next) => { ... });

// Server.ts (httpsRedirect)
this.app.get('/{*path}', (req, res) => { ... });
```

### Step 4: Fix error handlers
Add explicit types to the 4-arg error middleware:
```typescript
import { ErrorRequestHandler } from 'express';
// or explicitly type the parameters
this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => { ... });
```

### Step 5: Fix url.parse
```typescript
// relayRoute.ts
let uri = new URL(proxyUrl);
// Then update property access: uri.path → uri.pathname + uri.search
```

### Step 6: Fix swapped req/res in httpsRedirect
```typescript
// Server.ts line 114 — currently wrong:
this.app.get('*', (res: express.Response, req: express.Request) => {
// Fix to:
this.app.get('/{*path}', (req: express.Request, res: express.Response) => {
```

### Step 7: Install and verify
```bash
npm install
npx tsc
```

## Risk Assessment
- **Low risk** — This is a local dev server, not a library consumed by others
- The actual Express runtime behavior differences (async error propagation, path matching) work in our favor since this codebase already uses `try/catch` + `next(err)` patterns correctly
- The `app.all('/njsPC/*path')` change means `req.params.path` captures the sub-path (was `req.params[0]` in v4) — but the relay code uses `req.url` directly, so no functional impact
