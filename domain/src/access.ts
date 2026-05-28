import type { RecordCategory, RecordMeta } from "./clinical-history";

export type GrantType = "normal" | "break_glass" | "offline_emergency" | "write";

export interface Capability {
  grantId: string;
  locator: string;
  commitment: string;
}

export interface PresenceProof {
  tokenPublicKey: string;
  nonce: string;
  expiry: string;
  signature: string;
}

export interface CredentialProof {
  credentialId: string;
  subject: string;
  issuer: string;
  role: string;
  expiresAt: number;
  signature: string;
}

export interface AccessGrant {
  grantId: string;
  record: RecordMeta;
  grantee: string;
  grantType: GrantType;
  purpose: string;
  scopeCategory: RecordCategory;
  revealAt: number;
  expiresAt: number;
  revoked: boolean;
  vetoed: boolean;
}

export interface WriteGrant {
  grantId: string;
  subject: string;
  grantee: string;
  scopeCategory: RecordCategory;
  expiresAt: number;
  revoked: boolean;
  createdAt: number;
}
