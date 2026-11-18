# 102: Discount codes

Marketing wants a code, `SAVE10`, that takes 10% off.

## Acceptance criteria

- `POST /orders` accepts an optional `discountCode`.
- `SAVE10` takes 10% off each line. Unknown codes return `400`.
- The order shows the code used and the amount saved, in cents.
- The confirmation email shows the amount saved.
