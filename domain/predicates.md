# Domain Predicates — Vocabulary and Usage

This document describes the vocabulary of domain types used by the release predicate and the semantics of the predicate itself. All types live in `domain/src/` and are re-exported from `domain/src/index.ts`.

---

## Vocabulary

### `ClinicalHistoryTier`

```ts
type ClinicalHistoryTier =
  | "offline_emergency_card"
  | "online_emergency_bundle"
  | "full_clinical_history";
```

Tiers control the scope of data accessible under a grant. `offline_emergency_card` is the narrowest (break-glass scenario); `full_clinical_history` is the broadest.

---

### `RecordCategory`

```ts
type RecordCategory =
  | "allergy" | "medication" | "condition" | "procedure"
  | "lab" | "imaging" | "note" | "immunization" | "prescription"
  | "behavioral_health" | "reproductive_health" | "substance_use";
```

Classifies a clinical record. Used in `RecordMeta.category` and in `AccessGrant.scopeCategory` to restrict which category of records the grant covers.

---

### `RecordLocator`

```ts
interface RecordLocator {
  locator: string;           // Opaque off-chain address (no PHI)
  contentCommitment: string; // Cryptographic commitment to content
}
```

An opaque pointer to an encrypted record. `contentCommitment` lets a verifier detect tampering without decrypting. No protected health information is stored here directly.

---

### `RecordMeta`

```ts
interface RecordMeta {
  recordId: string;
  patient: string;        // Patient's public key / pseudonym
  category: RecordCategory;
  tier: ClinicalHistoryTier;
  locator: RecordLocator;
  createdAt: number;      // Unix seconds
  updatedAt?: number;     // Unix seconds, absent if never updated
}
```

The envelope describing a clinical record without revealing its content. Embedded in `AccessGrant.record`.

---

### `GrantType`

```ts
type GrantType = "normal" | "break_glass" | "offline_emergency" | "write";
```

| Value | Semantics |
|---|---|
| `normal` | Routine access within a clinical relationship |
| `break_glass` | Emergency override — triggers enhanced audit |
| `offline_emergency` | Access without network connectivity; subject to delayed audit |
| `write` | Append-only authoring permission. Not valid for KMS key release. |

---

### `Capability`

```ts
interface Capability {
  grantId: string;
  locator: string;     // Opaque reference to the encrypted key material
  commitment: string;  // Commitment to the capability token
}
```

A capability token that the KMS issues after the release predicate succeeds. Contains no secret key material itself; the KMS releases the actual key separately via a secure channel.

---

### `PresenceProof`

```ts
interface PresenceProof {
  tokenPublicKey: string; // Hex-encoded
  nonce: string;          // Hex-encoded
  expiry: string;         // ISO-8601 or Unix seconds (string)
  signature: string;      // Hex-encoded
}
```

Used in `DelayedOfflineAuditEvent` to prove that a clinician held a valid token at the time of offline access. All fields are hex-encoded strings; no raw bytes flow through the TypeScript layer.

---

### `CredentialProof`

```ts
interface CredentialProof {
  credentialId: string;
  subject: string;    // Public key of the credential holder
  issuer: string;     // Issuing authority public key
  role: string;       // e.g. "physician", "pharmacist"
  expiresAt: number;  // Unix seconds
  signature: string;  // Hex-encoded
}
```

A verifiable credential asserting the role of the access requester. Used during grant authorization; not embedded in the grant itself.

---

### `AccessGrant`

```ts
interface AccessGrant {
  grantId: string;
  record: RecordMeta;
  grantee: string;              // Public key of the authorized clinician
  grantType: GrantType;
  purpose: string;              // Free-text clinical purpose
  scopeCategory: RecordCategory;
  revealAt: number;             // Unix seconds — earliest time KMS may release key
  expiresAt: number;            // Unix seconds — latest time KMS may release key
  revoked: boolean;             // Set by the patient or their delegate
  vetoed: boolean;              // Set by a guardian / oversight party
}
```

The central grant object. All fields that the release predicate reads are boolean flags or numeric timestamps — no string parsing at evaluation time.

---

### `AuditEventAction`

```ts
type AuditEventAction =
  | "access_requested" | "access_granted" | "access_denied"
  | "capability_released" | "grant_revoked" | "grant_vetoed"
  | "offline_access_observed" | "offline_access_submitted";
```

The action recorded in every audit event. `offline_access_observed` is written at the device when connectivity is absent; `offline_access_submitted` is written when the device later syncs.

---

### `OnlineAuditEvent`

```ts
interface OnlineAuditEvent {
  // from AuditEventBase:
  eventId: string;
  action: AuditEventAction;
  grantId: string;
  recordId: string;
  actor: string;
  occurredAt: number;   // Unix seconds
  // discriminant:
  source: "online";
  // optional context:
  grant?: AccessGrant;
  capability?: Capability;
  reason?: string;      // Human-readable context for denials or revocations
}
```

Emitted when an access decision is made with full network connectivity. `grant` and `capability` are present on `access_granted` / `capability_released` events; `reason` is present on `access_denied`, `grant_revoked`, and `grant_vetoed`.

---

### `DelayedOfflineAuditEvent`

```ts
interface DelayedOfflineAuditEvent {
  // from AuditEventBase:
  eventId: string;
  action: AuditEventAction;
  grantId: string;
  recordId: string;
  actor: string;
  occurredAt: number;    // Unix seconds — when offline access happened
  // discriminant:
  source: "delayed_offline";
  // offline-specific:
  observedAt: number;    // Unix seconds — device clock at time of access
  submittedAt: number;   // Unix seconds — when the device synced this event
  submitter: string;     // Public key of the device submitting the event
  presenceProof: PresenceProof;
}
```

Emitted when a device submits an audit record after regaining connectivity. `observedAt` is the device-local timestamp; `occurredAt` mirrors it. The `presenceProof` attests the clinician held a valid token at access time.

---

### `AuditEvent`

```ts
type AuditEvent = OnlineAuditEvent | DelayedOfflineAuditEvent;
```

A discriminated union on `source`. Narrow with:

```ts
if (event.source === "online") { /* OnlineAuditEvent */ }
if (event.source === "delayed_offline") { /* DelayedOfflineAuditEvent */ }
```

---

## Release Predicate

### `PredicateDenyReason`

```ts
type PredicateDenyReason =
  | "NO_GRANT"
  | "WRONG_REQUESTER"
  | "REVOKED"
  | "VETOED"
  | "WRITE_GRANT_NOT_RELEASABLE"
  | "BEFORE_REVEAL"
  | "EXPIRED";
```

Exhaustive set of reasons a release request is denied.

| Reason | Condition |
|---|---|
| `NO_GRANT` | `grant` argument is `null` — no committed grant was found |
| `WRONG_REQUESTER` | `grant.grantee !== caller` |
| `REVOKED` | `grant.revoked === true` |
| `VETOED` | `grant.vetoed === true` |
| `WRITE_GRANT_NOT_RELEASABLE` | `grant.grantType === "write"` |
| `BEFORE_REVEAL` | `nowSeconds < grant.revealAt` |
| `EXPIRED` | `nowSeconds >= grant.expiresAt` |

Deny checks are evaluated in this exact order. The first matching check short-circuits and returns its reason.

---

### `PredicateResult`

```ts
type PredicateResult =
  | { allowed: true }
  | { allowed: false; reason: PredicateDenyReason };
```

A discriminated union on `allowed`. Safe to pass through JSON without loss of information.

---

### `evaluateReleasePredicate`

```ts
function evaluateReleasePredicate(
  grant: AccessGrant | null,
  caller: string,
  nowSeconds: number,
): PredicateResult
```

**Canonical release rule:**

```
grant !== null
  AND grant.grantee === caller
  AND NOT grant.revoked
  AND NOT grant.vetoed
  AND grant.grantType != "write"
  AND grant.revealAt <= nowSeconds
  AND nowSeconds < grant.expiresAt
```

**Properties:**
- Pure and deterministic — no network, storage, Stellar SDK, or KMS calls.
- `nowSeconds` must be provided by the caller; the function never reads a clock.
- The open interval `[revealAt, expiresAt)` means a grant that expires exactly at `now` is already denied.

**Usage:**

```ts
import { evaluateReleasePredicate } from "@medichain/domain";

const result = evaluateReleasePredicate(grant, clinicianPublicKey, Math.floor(Date.now() / 1000));

if (result.allowed) {
  // Proceed to KMS key release
} else {
  // result.reason is a PredicateDenyReason
  logger.warn("Release denied", { reason: result.reason });
}
```

**Where it runs:**

| Consumer | Role |
|---|---|
| `kms-gate` | Primary enforcement — called before releasing any key |
| Indexer / API read models | Materializes `isReleasable` on grant projection objects |
| Web / client | Shows grant status without a round-trip to the KMS |
| Conformance tests | Compares predicate output against on-chain broker grant states |

This function is the off-chain canonical mirror of the Soroban contract's on-chain authorization path. The contract and this predicate must remain aligned; if the contract rule changes, open a follow-up task to update this package.

## Append Write Grants

`GrantType: "write"` exists only for the Option A append path. A clinician with
a live write grant can author a new encrypted payload, upload that ciphertext to
storage, and call `append_record` with the resulting locator and commitment.
That operation does not read or release any existing ciphertext.

The KMS release predicate must reject write grants. Reads of the appended record
entry still require a separate `normal`, `break_glass`, or `offline_emergency`
grant for that record id.
