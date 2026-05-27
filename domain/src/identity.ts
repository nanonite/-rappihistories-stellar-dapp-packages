export type Role =
  | "patient"
  | "clinician"
  | "institution"
  | "pharmacy"
  | "distributor"
  | "manufacturer"
  | "responder"
  | "admin";

export type CredentialStatus = "active" | "revoked" | "expired";

export interface CredentialRef {
  subject: string;
  role: Role;
  issuer: string;
  expiresAt: number;
  status: CredentialStatus;
}

export interface IssuerRecord {
  issuer: string;
  registeredAt: number;
  active: boolean;
}
