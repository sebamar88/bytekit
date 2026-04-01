# Bytekit v3 Security Migration Guide

## Overview

`v3.0.0` is a security-focused major release. The most important changes are:

- safer logging and error serialization in `ApiClient`,
- explicit failure instead of weak crypto fallbacks in `CryptoUtils`,
- `https://` enforcement for remote CLI fetches,
- sanitization of generated TypeScript names and property keys.

## Breaking Changes

### 1. Sanitized `ApiError` output

`ApiError#details`, `ApiError#toJSON()`, and `ApiError#toString()` no longer expose raw payloads by default.

Why:
- raw request/response/error payloads frequently contain tokens, passwords, cookies, API keys, or personal data.
- stringifying those values by default is unsafe in production logs and telemetry.

What to change:
- if your app consumed serialized `ApiError` bodies, update those consumers to work with sanitized content.
- if you need raw payloads for local debugging, read `error.body` directly in controlled code, not through serialized output.

### 2. Safe-by-default `ApiClient` logging

`ApiClient` no longer logs raw request or response payloads by default.

What to change:
- if you truly need raw payload logging during local debugging, opt in with `logSensitiveData: true`.
- do not enable that setting in production.

### 3. No insecure hash fallback

`CryptoUtils.hash()` now throws when no secure crypto backend is available.

Previous behavior:
- bytekit could fall back to `simpleHash()`, which is not cryptographically secure.

New behavior:
- bytekit fails fast so callers cannot mistake a weak hash for a secure one.

What to change:
- ensure the runtime provides `crypto.subtle` or a real Node crypto backend.
- treat `simpleHash()` only as a non-security utility.

### 4. No ambiguous empty-string HMAC

`CryptoUtils.hmac()` now throws when secure crypto is unavailable.

What to change:
- handle exceptions explicitly instead of assuming an empty string means failure.

### 5. Remote CLI fetches require HTTPS

The CLI now rejects remote `http://` URLs for `--type`, `--swagger`, and direct fetch mode.

Allowed:
- `https://api.example.com/openapi.json`
- `http://localhost:3000/openapi.json`
- `http://127.0.0.1:3000/openapi.json`

Rejected:
- `http://staging.example.com/openapi.json`

What to change:
- move remote specs/endpoints to `https://`,
- or proxy them locally during development.

### 6. Sanitized generated type names

Generated schemas now sanitize unsafe identifiers.

Examples:
- `user-profile` becomes `UserProfile`
- `default` becomes `"default"` when used as a property key
- `1password` becomes `"1password"` when used as a property key

What to change:
- refresh generated files,
- update imports or snapshots that depended on old unsanitized names.

## Recommended Upgrade Steps

1. Upgrade to `bytekit@3`.
2. Regenerate any CLI-produced types.
3. Re-run tests and snapshot checks.
4. Audit any code that serializes `ApiError`.
5. Keep `logSensitiveData` disabled outside local debugging.
