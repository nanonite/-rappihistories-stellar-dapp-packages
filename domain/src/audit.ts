import type { AccessGrant, Capability, PresenceProof } from "./access";

export type AuditEventAction =
  | "access_requested"
  | "access_granted"
  | "access_denied"
  | "capability_released"
  | "grant_revoked"
  | "grant_vetoed"
  | "offline_access_observed"
  | "offline_access_submitted";

interface AuditEventBase {
  eventId: string;
  action: AuditEventAction;
  grantId: string;
  recordId: string;
  actor: string;
  occurredAt: number;
}

export interface OnlineAuditEvent extends AuditEventBase {
  source: "online";
  grant?: AccessGrant;
  capability?: Capability;
  reason?: string;
}

export interface DelayedOfflineAuditEvent extends AuditEventBase {
  source: "delayed_offline";
  observedAt: number;
  submittedAt: number;
  submitter: string;
  presenceProof: PresenceProof;
}

export type AuditEvent = OnlineAuditEvent | DelayedOfflineAuditEvent;
