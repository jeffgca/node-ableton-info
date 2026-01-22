# Basic Node Template

![CI](https://github.com/jeffgca/node-tpl/actions/workflows/test.yml/badge.svg)

> Minimal Node module starter with tests.

## Requirements

- Node: >= 20 (verified with Node 22)
- Package manager: pnpm

## Testing (Vitest)

- Run tests: `pnpm test`
- Watch mode: `pnpm watch`
- Coverage: `pnpm run coverage` (HTML report in `coverage/index.html`)

## Why Vitest?

- Fast, Vite-powered transforms
- Native ESM support (no `--experimental-vm-modules` flags)
- Jest-compatible APIs via `vi.*` (e.g., `vi.fn`, `vi.spyOn`, `vi.mock`)

## Migrated From Jest

- Replaced Jest scripts with Vitest in [package.json](package.json).
- Added [vitest.config.js](vitest.config.js) for Node environment, globals, and V8 coverage.
- Tests using global `test`/`expect` continue to work unchanged.

## Links

- Vitest Guide: https://vitest.dev/guide/
- Vitest Config Reference: https://vitest.dev/config/
