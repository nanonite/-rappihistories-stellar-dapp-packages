export const DOMAIN_VERSION = "0.1.0";

export type {
  AccessGrant,
  Capability,
  CredentialProof,
  GrantType,
  PresenceProof,
} from "./access";
export type {
  ClinicalHistoryTier,
  RecordCategory,
  RecordLocator,
  RecordMeta,
} from "./clinical-history";
export type {
  AuditEvent,
  AuditEventAction,
  DelayedOfflineAuditEvent,
  OnlineAuditEvent,
} from "./audit";
export {
  evaluateReleasePredicate,
} from "./predicate";
export type {
  PredicateDenyReason,
  PredicateResult,
} from "./predicate";
export type {
  CredentialRef,
  CredentialStatus,
  IssuerRecord,
  Role,
} from "./identity";
export type {
  DispensationReceipt,
  Prescription,
  PrescriptionState,
  ReservationPrivacyRef,
} from "./prescription";
export type {
  BatchStatus,
  CustodyRecord,
  DrugBatch,
  DrugProduct,
  InventoryUnit,
  UnitStatus,
} from "./supplychain";
