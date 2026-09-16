namespace anubhav.claude;

using { cuid } from '@sap/cds/common';
using { anubhav.claude.Users } from './schema';

// ─── UserCredentials ──────────────────────────────────────────────────────────
// Sibling entity to Users — stores password hash + login telemetry.
// Kept separate so the Users entity (and its service projections) stay untouched.

entity UserCredentials : cuid {
    user           : Association to Users;
    passwordHash   : String(200);
    failedAttempts : Integer default 0;
    lastLoginAt    : Timestamp;
}
