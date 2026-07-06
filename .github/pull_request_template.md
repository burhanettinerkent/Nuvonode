## Summary

- 

## Verification

- [ ] `cd apps/api && go test ./...`
- [ ] `cd apps/provider-node && go test ./...`
- [ ] Manual/curl check, if relevant:

## Scope check

- [ ] No fiat payout logic
- [ ] No crypto/token payout logic
- [ ] No prompt logging enabled by default
- [ ] No plaintext API key/provider token persistence
- [ ] Credit movement changes write `wallet_ledger` in the same transaction

## Notes for maintainers

- Rollout/migration notes:
- Follow-ups:
