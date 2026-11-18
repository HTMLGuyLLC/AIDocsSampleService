# Orders service

Read `docs/orders.md` before changing anything here.

- Status moves only forward: `pending → paid → refunded`. Every move happens in `orders.ts`, and each one has a test.
- Prices are copied onto the order when it is created. Never look them up again from `catalog.ts` for an existing order.
- Charge and refund only through `billing`. Never set `paymentId` or `status: 'paid'` any other way.
- Emails go through `notify()`, which swallows failures on purpose. A failed email must not undo a payment.
- Return copies (`structuredClone`), never the stored object.
