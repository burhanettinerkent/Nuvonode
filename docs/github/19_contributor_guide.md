# 19 — Contributor Guide

## Project philosophy

Build a small working system first. Avoid adding complex features before the V1 loop is stable.

## Good contribution areas

- Provider hardware detection
- Provider install guides
- Model registry improvements
- Dashboard UX
- Tests
- Security hardening
- Documentation
- Routing improvements
- Token estimation improvements

## Contribution rules

- Keep V1 internal-credit-only.
- Do not add payout claims.
- Do not add paid external model calls by default.
- Do not log prompts by default.
- Do not add arbitrary command execution to provider node.
- Keep setup easy for Windows/Linux users.

## Pull request checklist

- Tests added or updated
- Docs updated
- No secrets committed
- No prompt logging introduced
- Wallet ledger rules preserved
- Error responses follow standard shape
- Screens include loading/empty/error states if frontend

## Code style

Backend:

- Small service methods
- Context-aware DB calls
- Explicit transactions for wallet/job settlement
- Structured logging
- No panics in request path

Provider:

- Clear terminal output
- Safe defaults
- Reconnect on network errors
- Never run arbitrary commands

Frontend:

- Typed API responses
- Simple accessible forms
- Copy buttons for commands/keys
- Clear V1 disclaimers
