---
name: release-notes
description: Turn merged pull requests into short, customer-friendly release notes. Use when asked for release notes, a changelog, or "what shipped this week".
---

# Release notes

1. **Find the range.** Ask for it if not given: since the last tag, or since a date. Default to `git describe --tags --abbrev=0`..`HEAD`.
2. **List what merged.** `git log --merges --first-parent <range> --format='%s%n%b---'` (or `gh pr list --state merged` if you have GitHub access).
   Read the PR titles, descriptions and linked tickets.
3. **Sort into groups:** New, Better, Fixed. Skip pure refactors, dependency bumps, docs and test-only changes.
4. **Write for a customer, not a developer.**
   - Say what they can now do or what stopped going wrong. One line each.
   - No ticket numbers, file names, or internal words (`AppError`, `noteDetails`).
   - Plain words. "You can now add a note to your order" beats "Order notes feature shipped".
5. **Don't promise.** Only list what merged. Don't guess dates or say "coming soon".
6. **Flag risk to a person.** If a change touches money, refunds or emails, say so in your reply (not in the notes) so someone double-checks the wording.

Output format:

```md
## Release <date or version>

### New
- ...

### Better
- ...

### Fixed
- ...
```

Give the notes in chat. Don't commit them or post them anywhere unless asked.
