export type PrescriptionState =
  | "issued"
  | "reserved"
  | "dispensed"
  | "closed"
  | "expired"
  | "cancelled";

export interface ReservationPrivacyRef {
  reservationRef: string;
  prescriptionId: string;
  unitId: string;
  pharmacy: string;
  reservedAt: number;
  expiresAt: number;
}

export interface Prescription {
  prescriptionId: string;
  clinician: string;
  patientPseudonym: string;
  drugClass: string;
  state: PrescriptionState;
  issuedAt: number;
  expiresAt: number;
  reservation?: ReservationPrivacyRef;
}

export interface DispensationReceipt {
  receiptId: string;
  prescriptionId: string;
  unitId: string;
  pharmacy: string;
  patient: string;
  dispensedAt: number;
  dispensationReceiptCommitment: string;
}
