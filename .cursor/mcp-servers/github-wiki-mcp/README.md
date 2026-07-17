# github-wiki-mcp (vendored)

Vendored from [andreahaku/github_wiki_mcp](https://github.com/andreahaku/github_wiki_mcp).

Upstream uses `pnpm` in `prepare`, which breaks `npx` installs when pnpm is not installed. This copy builds with `npm run build` only.

## Rebuild

```bash
cd .cursor/mcp-servers/github-wiki-mcp
npm install
npm run build
```

Committed `dist/` lets Cursor start the MCP without a local build. Rebuild after updating `src/`.
