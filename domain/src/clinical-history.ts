export type ClinicalHistoryTier =
  | "offline_emergency_card"
  | "online_emergency_bundle"
  | "full_clinical_history";

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

export type RecordLocatorType = "s3" | "opaque";

export interface RecordLocator {
  locatorType: RecordLocatorType;
  locator: string;
  contentCommitment: string;
}

export interface RecordMeta {
  recordId: string;
  patient: string;
  category: RecordCategory;
  tier: ClinicalHistoryTier;
  locator: RecordLocator;
  createdAt: number;
  updatedAt?: number;
}
