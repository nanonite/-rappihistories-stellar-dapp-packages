export const DOMAIN_VERSION = "0.1.0";

export type {
  AccessGrant,
  Capability,
  CredentialProof,
  GrantType,
  PresenceProof,
  WriteGrant,
} from "./access.js";
export type {
  ClinicalHistoryTier,
  RecordCategory,
  RecordLocator,
  RecordLocatorType,
  RecordMeta,
} from "./clinical-history.js";
export type {
  AuditEvent,
  AuditEventAction,
  DelayedOfflineAuditEvent,
  OnlineAuditEvent,
} from "./audit.js";
export {
  evaluateReleasePredicate,
} from "./predicate.js";
export type {
  PredicateDenyReason,
  PredicateResult,
} from "./predicate.js";
export type {
  CredentialRef,
  CredentialStatus,
  IssuerRecord,
  Role,
} from "./identity.js";
export type {
  DispensationReceipt,
  Prescription,
  PrescriptionState,
  ReservationPrivacyRef,
} from "./prescription.js";
export type {
  BatchStatus,
  CustodyRecord,
  DrugBatch,
  DrugProduct,
  InventoryUnit,
  UnitStatus,
} from "./supplychain.js";
