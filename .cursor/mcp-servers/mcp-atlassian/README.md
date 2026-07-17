# mcp-atlassian (vendored)

Vendored from [Vijay-Duke/mcp-atlassian](https://github.com/Vijay-Duke/mcp-atlassian) npm package `mcp-atlassian@2.1.0`.

Pre-built `dist/` is committed. Upstream lists `jsdom` as a devDependency but imports it at runtime — this vendored `package.json` moves `jsdom` to `dependencies`.

## Required env (set in shell; mapped in `.cursor/mcp.json`)

- `ATLASSIAN_URL` → `ATLASSIAN_BASE_URL`
- `ATLASSIAN_EMAIL`
- `ATLASSIAN_API_TOKEN`

## Reinstall deps

```bash
cd .cursor/mcp-servers/mcp-atlassian
npm ci --omit=dev
```
