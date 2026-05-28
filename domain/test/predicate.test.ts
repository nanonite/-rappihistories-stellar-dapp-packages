import { describe, expect, test } from "bun:test";
import type { AccessGrant } from "../src/access";
import { evaluateReleasePredicate } from "../src/predicate";

const caller = "clinician-public-key";
const nowSeconds = 1_700_000_000;

const baseGrant: AccessGrant = {
  grantId: "grant-1",
  record: {
    recordId: "record-1",
    patient: "patient-public-key",
    category: "condition",
    tier: "full_clinical_history",
    locator: {
      locatorType: "opaque",
      locator: "opaque://record-1",
      contentCommitment: "b4f77d5c0c17d4b91a55d9d4c8219e38",
    },
    createdAt: nowSeconds - 100,
  },
  grantee: caller,
  grantType: "normal",
  purpose: "treatment",
  scopeCategory: "condition",
  revealAt: nowSeconds - 1,
  expiresAt: nowSeconds + 300,
  revoked: false,
  vetoed: false,
};

function grantWith(overrides: Partial<AccessGrant>): AccessGrant {
  return {
    ...baseGrant,
    ...overrides,
  };
}

describe("evaluateReleasePredicate", () => {
  test("denies when no committed grant exists", () => {
    expect(evaluateReleasePredicate(null, caller, nowSeconds)).toEqual({
      allowed: false,
      reason: "NO_GRANT",
    });
  });

  test("denies when the caller is not the grantee", () => {
    expect(
      evaluateReleasePredicate(baseGrant, "other-clinician", nowSeconds),
    ).toEqual({
      allowed: false,
      reason: "WRONG_REQUESTER",
    });
  });

  test("denies when the grant is revoked", () => {
    expect(
      evaluateReleasePredicate(grantWith({ revoked: true }), caller, nowSeconds),
    ).toEqual({
      allowed: false,
      reason: "REVOKED",
    });
  });

  test("denies when the grant is vetoed", () => {
    expect(
      evaluateReleasePredicate(grantWith({ vetoed: true }), caller, nowSeconds),
    ).toEqual({
      allowed: false,
      reason: "VETOED",
    });
  });

  test("denies before the reveal timestamp", () => {
    expect(
      evaluateReleasePredicate(
        grantWith({ revealAt: nowSeconds + 1 }),
        caller,
        nowSeconds,
      ),
    ).toEqual({
      allowed: false,
      reason: "BEFORE_REVEAL",
    });
  });

  test("denies when now equals the expiry timestamp", () => {
    expect(
      evaluateReleasePredicate(
        grantWith({ expiresAt: nowSeconds }),
        caller,
        nowSeconds,
      ),
    ).toEqual({
      allowed: false,
      reason: "EXPIRED",
    });
  });

  test("denies when now is greater than the expiry timestamp", () => {
    expect(
      evaluateReleasePredicate(
        grantWith({ expiresAt: nowSeconds - 1 }),
        caller,
        nowSeconds,
      ),
    ).toEqual({
      allowed: false,
      reason: "EXPIRED",
    });
  });

  test("allows a matching active grant inside its release window", () => {
    expect(evaluateReleasePredicate(baseGrant, caller, nowSeconds)).toEqual({
      allowed: true,
    });
  });
});
