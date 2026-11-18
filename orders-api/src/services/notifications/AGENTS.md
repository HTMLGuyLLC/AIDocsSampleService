# Notifications service

Read `docs/notifications.md` before changing anything here.

- Every customer email is a function in `templates`. Don't build email text anywhere else.
- Keep the wording plain and friendly. Show money with `formatCents`.
- Sending is best effort. Callers must not fail because an email failed.
