---
slug: developer
title: Developer Utilities
description: Browser-based tools for developers — format JSON, encode Base64, convert between data formats. All local, no uploads.
---

# Developer Utilities

ConvertYard's developer tools run entirely in your browser. No server, no account, no clipboard snooping.

## Live tools

- **JSON Formatter** (`json-formatter`) — Format, validate, and minify JSON with syntax highlighting and error location reporting.
- **Base64 Encoder/Decoder** (`base64`) — Encode text or files to Base64, decode Base64 strings. URL-safe mode supported.
- **JSON to CSV** (`json-to-csv`) — Flatten JSON arrays into CSV spreadsheets. Handles nested objects (dot notation) and arrays (pipe-joined).

## Planned tools

- **Diff Checker** (`diff-checker`) — Visual side-by-side text diff.
- **JWT Decoder** (`jwt-decoder`) — Decode and inspect JWT tokens without signature verification.
- **Regex Tester** (`regex-tester`) — Test regex patterns against text with live match highlighting.
- **URL Encoder** (`url-encoder`) — Encode and decode URL components.
- **Hash Generator** (`hash-generator`) — Generate MD5, SHA-1, SHA-256 hashes from text or files.

## Architecture note

Text-input tools use `TextToolConfig` + `TextToolShell` (not `ToolConfig` + `ToolShell`). See `lib/types-text.ts` and `components/text-tool-shell/`. These tools are pure JS — no WASM — making them the fastest-loading tools on the site.
