# Security Specification for Shipping App

## Data Invariants
- Each user must have a valid role: `Admin`, `Manager`, or `Accountant`.
- A Voucher must have a unique `voucherNumber`.
- Only `Admin` and `Manager` can delete or modify any voucher.
- `Accountant` can create and edit their own vouchers, but not others.

## The "Dirty Dozen" Payloads
1. Create a user without a role.
2. Create a user with a spoofed role (e.g., `SuperAdmin`).
3. Update a voucher number to a very large string (DoS).
4. Create a voucher where `createdBy` does not match the UID.
5. `Accountant` attempting to delete a voucher they didn't create.
6. `Accountant` attempting to edit a voucher's `createdBy` field.
7. Anonymous user attempting to read any data.
8. Unverified email user attempting to write data.
9. Injecting a 1MB string into a voucher ID.
10. Modifying `createdAt` timer.
11. Reading the `/users` collection list without being an Admin.
12. Creating a voucher with an ID field that is an object instead of a string.

## Test Runner
(Placeholder for actual test implementation logic)
