import type { AccessGrant } from "./access";

export type PredicateDenyReason =
  | "NO_GRANT"
  | "WRONG_REQUESTER"
  | "REVOKED"
  | "VETOED"
  | "WRITE_GRANT_NOT_RELEASABLE"
  | "BEFORE_REVEAL"
  | "EXPIRED";

export type PredicateResult =
  | { allowed: true }
  | { allowed: false; reason: PredicateDenyReason };

export function evaluateReleasePredicate(
  grant: AccessGrant | null,
  caller: string,
  nowSeconds: number,
): PredicateResult {
  if (grant === null) {
    return { allowed: false, reason: "NO_GRANT" };
  }

  if (grant.grantee !== caller) {
    return { allowed: false, reason: "WRONG_REQUESTER" };
  }

  if (grant.revoked) {
    return { allowed: false, reason: "REVOKED" };
  }

  if (grant.vetoed) {
    return { allowed: false, reason: "VETOED" };
  }

  if (grant.grantType === "write") {
    return { allowed: false, reason: "WRITE_GRANT_NOT_RELEASABLE" };
  }

  if (nowSeconds < grant.revealAt) {
    return { allowed: false, reason: "BEFORE_REVEAL" };
  }

  if (nowSeconds >= grant.expiresAt) {
    return { allowed: false, reason: "EXPIRED" };
  }

  return { allowed: true };
}
