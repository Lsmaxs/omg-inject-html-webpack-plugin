# Changelog

## 2.0.0 (2026-04-22)

### Breaking Changes
- Requires Node.js >= 18.0.0
- `html-webpack-plugin` is now a **peerDependency** (>= 5.0.0) — install it separately
- `templateParameters` callback receives html-webpack-plugin v5-shaped `assetTags` (`{ headTags, bodyTags }`)
- `options.inject` now requires boolean type (throws on non-boolean input)
- Removed `dependencies` field — `html-webpack-plugin` moved to `peerDependencies`

### Features
- **Webpack 5 support** — fully compatible with webpack 5.x
- **html-webpack-plugin 5.x support** — compatible with v5 API including `getCompilationHooks`
- **Dual CJS/ESM module export** — `index.js` (CommonJS) + `index.mjs` (ESM)
- **Async file I/O** for inline mode — `fs.promises.readFile` replaces `fs.readFileSync`
- **Input validation** — constructor validates `inject` option type
- **package.json `exports` field** — proper module resolution for both import styles

### Bug Fixes
- Fixed logical bug in inline file path resolution (`||` → `&&` in condition)

### Removed
- Removed commented-out code from v1.x (30 lines)
- Removed deprecated devDependencies:
  - `extract-text-webpack-plugin`
  - `node-sass` (replaced by `sass`)
  - `file-loader` / `url-loader` (replaced by webpack 5 Asset Modules)
  - `uglify-js` (webpack 5 has built-in Terser)
  - `underscore`, `open-browser-webpack-plugin`, `react-lazyload`, `react-router`

### Migration Guide (v1.x → v2.0)

1. Install peer dependency:
   ```bash
   npm install html-webpack-plugin@^5.0.0
   ```

2. Update Node.js to >= 18.0.0

3. If you import via ESM:
   ```javascript
   import OmgInjectHtmlWebpackPlugin from 'omg-inject-html-webpack-plugin';
   ```

4. No API changes for plugin options — `inject`, `htmlDir`, `templateParameters` remain the same

---

## 1.3.3
- Bug fixes and stability improvements

## 1.3.2
- Minor updates

## 1.3.0
- Added inline mode support
- Added Handlebars template support
