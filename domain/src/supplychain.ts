export type BatchStatus =
  | "available"
  | "reserved"
  | "dispensed"
  | "quarantined"
  | "expired";

export type UnitStatus =
  | "available"
  | "reserved"
  | "dispensed"
  | "quarantined"
  | "expired";

export interface DrugProduct {
  productId: string;
  gtin: string;
  drugClass: string;
  manufacturer: string;
}

export interface DrugBatch {
  batchId: string;
  product: DrugProduct;
  lotNumber: string;
  expiryDate: number;
  unitCount: number;
  status: BatchStatus;
  registeredAt: number;
}

export interface InventoryUnit {
  unitId: string;
  batchId: string;
  serialNumber: string;
  status: UnitStatus;
  currentCustodian: string;
  reservationRef?: string;
}

export interface CustodyRecord {
  custodyRecordId: string;
  unitId: string;
  from: string;
  to: string;
  transferredAt: number;
  opposingAttesterSignature: string;
}
