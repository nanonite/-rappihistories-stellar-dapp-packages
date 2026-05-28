export interface MedRecord {
  doctor: string;
  timestamp: string;
  dataHash: string;
  recordType: string;
  notes: string;
}

export type ClinicalHistoryTier =
  | "offline_emergency_card"
  | "online_emergency_bundle"
  | "full_clinical_history";

export type GrantType =
  | "normal"
  | "break_glass"
  | "offline_emergency"
  | "write";

export interface Patient {
  address: string;
  authorizedDoctors: string[];
  records: MedRecord[];
}

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
}

export type RecordType =
  | "lab_result"
  | "prescription"
  | "diagnosis"
  | "vaccination"
  | "imaging"
  | "surgery"
  | "referral"
  | "discharge"
  | "visit_note"
  | "other";

export type RecordCategory =
  | "allergy"
  | "medication"
  | "condition"
  | "procedure"
  | "lab"
  | "imaging"
  | "note"
  | "immunization"
  | "prescription"
  | "behavioral_health"
  | "reproductive_health"
  | "substance_use";

export interface RecordLocator {
  locatorType: "opaque" | "s3";
  locator: string;
  contentCommitment: string;
}

export interface HistoryRecord {
  recordId: string;
  subject: string;
  author: string;
  tier: ClinicalHistoryTier;
  category: RecordCategory;
  locator: RecordLocator;
  createdAt: number;
  writeGrantId: string | null;
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

export interface AppendRecordRequest {
  author: string;
  subject: string;
  writeGrantId: string;
  recordId: string;
  tier: ClinicalHistoryTier;
  category: RecordCategory;
  locator: RecordLocator;
}

export interface AppendRecordResult {
  record: HistoryRecord;
}

export function isWriteGrant(value: unknown): value is WriteGrant {
  if (!isObject(value)) return false;

  return (
    typeof value.grantId === "string" &&
    typeof value.subject === "string" &&
    typeof value.grantee === "string" &&
    isRecordCategory(value.scopeCategory) &&
    typeof value.expiresAt === "number" &&
    typeof value.revoked === "boolean" &&
    typeof value.createdAt === "number"
  );
}

export function isAppendRecord(value: unknown): value is AppendRecordRequest {
  if (!isObject(value)) return false;

  return (
    typeof value.author === "string" &&
    typeof value.subject === "string" &&
    typeof value.writeGrantId === "string" &&
    typeof value.recordId === "string" &&
    isClinicalHistoryTier(value.tier) &&
    isRecordCategory(value.category) &&
    isRecordLocator(value.locator)
  );
}

export function isWriteGrantLive(
  grant: WriteGrant,
  subject: string,
  category: RecordCategory,
  nowSeconds: number,
): boolean {
  return (
    grant.subject === subject &&
    grant.scopeCategory === category &&
    !grant.revoked &&
    nowSeconds < grant.expiresAt
  );
}

export function canAppendRecord(
  grant: WriteGrant | null,
  author: string,
  subject: string,
  category: RecordCategory,
  nowSeconds: number,
): boolean {
  return (
    grant !== null &&
    grant.grantee === author &&
    isWriteGrantLive(grant, subject, category, nowSeconds)
  );
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  lab_result: "Resultado de Laboratorio",
  prescription: "Receta",
  diagnosis: "Diagnóstico",
  vaccination: "Vacunación",
  imaging: "Imagenología",
  surgery: "Cirugía",
  referral: "Referencia",
  discharge: "Resumen de Alta",
  visit_note: "Nota de Consulta",
  other: "Otro",
};

function isClinicalHistoryTier(value: unknown): value is ClinicalHistoryTier {
  return (
    value === "offline_emergency_card" ||
    value === "online_emergency_bundle" ||
    value === "full_clinical_history"
  );
}

function isRecordCategory(value: unknown): value is RecordCategory {
  return (
    value === "allergy" ||
    value === "medication" ||
    value === "condition" ||
    value === "procedure" ||
    value === "lab" ||
    value === "imaging" ||
    value === "note" ||
    value === "immunization" ||
    value === "prescription" ||
    value === "behavioral_health" ||
    value === "reproductive_health" ||
    value === "substance_use"
  );
}

function isRecordLocator(value: unknown): value is RecordLocator {
  if (!isObject(value)) return false;

  return (
    (value.locatorType === "opaque" || value.locatorType === "s3") &&
    typeof value.locator === "string" &&
    typeof value.contentCommitment === "string"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
