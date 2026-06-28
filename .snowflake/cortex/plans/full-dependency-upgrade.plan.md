# Plan: Full Dependency Upgrade

## Summary of Version Changes

| Package | Current | Target | Breaking? |
|---------|---------|--------|-----------|
| express | ^4.21.2 | ^5.2.1 | Yes |
| @types/express | ^4.17.23 | ^5.0.6 | Yes |
| typescript | ^4.9.5 | ^5.9.3 | Minor |
| @types/node | ^20.14.10 | ^22.0.0 | Minor |
| jquery | ^3.7.1 | ^4.0.0 | Yes |
| jquery-ui | ^1.14.1 | ^1.14.1 | No change (already correct) |
| jquery-ui-dist | ^1.13.3 | REMOVE | Replace with jquery-ui/dist |
| @fortawesome/fontawesome-free | ^6.7.2 | ^7.3.0 | Yes (shim available) |
| multer | ^2.0.2 | ^2.2.0 | No |
| socket.io | ^4.8.1 | ^4.8.1 | No change |
| socket.io-client | ^4.8.1 | ^4.8.1 | No change |
| winston | ^3.17.0 | ^3.19.0 | No |
| extend | ^3.0.2 | ^3.0.2 | No change |
| node-ssdp | ^4.0.1 | ^4.0.1 | No change |
| jquery-ui-touch-punch-c | ^1.4.0 | ^1.4.0 (patch in-repo) | Needs patch |
| ts-node | ^10.9.2 | ^10.9.2 | No change |

---

## Step 1: Update package.json

Update `dependencies`:
```json
"@fortawesome/fontawesome-free": "^7.3.0",
"express": "^5.2.1",
"jquery": "^4.0.0",
"jquery-ui": "^1.14.1",
"multer": "^2.2.0",
"winston": "^3.19.0"
```
Remove `"jquery-ui-dist"` (replaced by jquery-ui/dist).

Update `devDependencies`:
```json
"@types/express": "^5.0.6",
"@types/node": "^22.0.0",
"typescript": "^5.9.3"
```

---

## Step 2: Update tsconfig.json

Add `esModuleInterop: true` — this is the primary fix for the socket.io compilation error (`Module '"http"' has no default export`). Also add `moduleResolution: "node"` for proper type resolution.

```json
{
  "compilerOptions": {
    "noImplicitAny": false,
    "module": "commonjs",
    "noEmitOnError": true,
    "removeComments": false,
    "sourceMap": true,
    "target": "ES2022",
    "preserveConstEnums": true,
    "outDir": "dist",
    "esModuleInterop": true,
    "moduleResolution": "node"
  },
  "exclude": ["node_modules"]
}
```

---

## Step 3: Fix Express 5 Breaking Changes

### 3a. Route wildcards (Express 5 requires named params)

[server/relay/relayRoute.ts](server/relay/relayRoute.ts) line 16:
```typescript
// Before:
app.all('/njsPC/*', async (req, res, next) => {
// After:
app.all('/njsPC/*path', async (req, res, next) => {
```

[server/Server.ts](server/Server.ts) line 114 (httpsRedirect):
```typescript
// Before:
this.app.get('*', (res: express.Response, req: express.Request) => {
// After (also fixes the swapped parameters):
this.app.get('/{*path}', (req: express.Request, res: express.Response) => {
```

### 3b. Error handler typing (4-arg middleware)

[server/Server.ts](server/Server.ts) lines 173 and 341:
```typescript
// Before:
this.app.use((error, req, res, next) => {
// After:
this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
```

### 3c. Replace deprecated url.parse()

[server/relay/relayRoute.ts](server/relay/relayRoute.ts) line 129:
```typescript
// Before:
import * as url from "url";
let uri = url.parse(proxyUrl);
// then uses: uri.protocol, uri.hostname, uri.path, uri.port

// After:
let uri = new URL(proxyUrl);
// uri.pathname + uri.search replaces uri.path
let opts = {
    protocol: uri.protocol,
    hostname: uri.hostname,
    path: uri.pathname + uri.search,
    port: uri.port,
    ...
};
```

Remove the `import * as url from "url"` line (the `URL` constructor is a global in Node 20+).

---

## Step 4: Fix jQuery 4 Breaking Changes

### 4a. Replace removed APIs in scripts/widgets.js

4 occurrences of `jQuery.isFunction(data)` -> `typeof data === 'function'`
4 occurrences of `jQuery.isArray(data)` -> `Array.isArray(data)`

These appear at lines 284, 315, 392, 457 in [scripts/widgets.js](scripts/widgets.js).

### 4b. Replace $.getScript()

[scripts/messages/messageList/sendMessageQueue.widget.js](scripts/messages/messageList/sendMessageQueue.widget.js) line 163:
```javascript
// Before:
$.getScript(url, callback);
// After:
$.ajax({ url: url, dataType: 'script', cache: true }).done(callback);
```

### 4c. Switch jquery-ui static route

[server/Server.ts](server/Server.ts) — change the static serving to use `jquery-ui/dist/` structure:
```typescript
// Before:
this.app.use('/jquery-ui', express.static(path.join(process.cwd(), '/node_modules/jquery-ui-dist/'), { maxAge: '60d' }));

// After: serve the CSS/images from the theme directory, JS from dist root
this.app.use('/jquery-ui', express.static(path.join(process.cwd(), '/node_modules/jquery-ui/dist/themes/base/'), { maxAge: '60d' }));
this.app.use('/jquery-ui', express.static(path.join(process.cwd(), '/node_modules/jquery-ui/dist/'), { maxAge: '60d' }));
```

This layered approach serves `jquery-ui.js` from `dist/` and `jquery-ui.css` + `images/` from `dist/themes/base/`.

### 4d. Remove redundant jquery-ui.theme.css link from HTML

Both [pages/index.html](pages/index.html) and [pages/messageManager.html](pages/messageManager.html) include:
```html
<link rel="stylesheet" type="text/css" href="jquery-ui/jquery-ui.theme.css" />
```
This file doesn't exist in jquery-ui 1.14's dist (the theme is bundled into `jquery-ui.css`). Remove these lines.

### 4e. Patch jquery-ui-touch-punch-c for jQuery 4

The touch-punch shim at `node_modules/jquery-ui-touch-punch-c/jquery.ui.touch-punch.js` uses `.bind()` and `.unbind()` which are removed in jQuery 4. Since this is a node_module, the cleanest fix is to add a small postinstall script or fork into the project. The changes needed:
- `.bind(` -> `.on(`  (2 occurrences)
- `.unbind(` -> `.off(` (1 occurrence)

Approach: Copy `jquery.ui.touch-punch.js` into `scripts/vendor/jquery.ui.touch-punch.js`, apply the `.bind()`/`.unbind()` fix, and update HTML to load from `scripts/vendor/` instead of the npm package. Then remove `jquery-ui-touch-punch-c` from package.json.

---

## Step 5: Font Awesome 7 Upgrade

FA7 ships backward-compatibility layers:
- `css/v5-font-face.css` — registers `'Font Awesome 5 Free'` as an alias (fixes theme CSS)
- `css/v4-shims.css` — maps old icon names to new names (covers the ~30 renamed icons)

### 5a. Add shim CSS to HTML pages

In both [pages/index.html](pages/index.html) and [pages/messageManager.html](pages/messageManager.html), after the existing FA link, add:
```html
<link rel="stylesheet" type="text/css" href="font-awesome/css/all.css" />
<link rel="stylesheet" type="text/css" href="font-awesome/css/v4-shims.css" />
<link rel="stylesheet" type="text/css" href="font-awesome/css/v5-font-face.css" />
```

This ensures all old icon class names and the `font-family: 'Font Awesome 5 Free'` references in theme CSS continue to work. No SCSS or theme file changes needed.

---

## Step 6: Install and Build

```bash
npm install
npx tsc
```

If TypeScript produces additional errors beyond what's covered above (unlikely given the analysis), they'll be type-narrowing issues from stricter TS 5.9 inference — fixable case-by-case.

---

## Step 7: Runtime Verification

1. `npm start` — confirm server starts without errors
2. Open `http://localhost:4200` — verify main dashboard loads
3. Check browser console for jQuery deprecation warnings or icon rendering issues
4. Open `http://localhost:4200/messageManager.html` — verify Message Manager loads
5. Test drag/sort interactions (uses touch-punch + jquery-ui sortable)
6. Verify schedule day toggles render FA check/circle icons correctly
7. Test file upload (multer 2.2 API unchanged for single-file uploads)

---

## Critical Files

- [server/Server.ts](server/Server.ts) — Express app setup, static routes, error handlers, jquery-ui mapping
- [server/relay/relayRoute.ts](server/relay/relayRoute.ts) — Wildcard route, url.parse, proxy logic
- [scripts/widgets.js](scripts/widgets.js) — jQuery.isFunction/isArray removals (core widget library)
- [pages/index.html](pages/index.html) — Script/CSS loading order, FA shims, jquery-ui.theme.css removal
- [tsconfig.json](tsconfig.json) — esModuleInterop fix (resolves the socket.io TS error)
