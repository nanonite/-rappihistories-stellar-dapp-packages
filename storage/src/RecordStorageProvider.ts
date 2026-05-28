export type RecordLocatorType = "s3";

export interface RecordLocator {
  locatorType: RecordLocatorType;
  locator: string;
  contentCommitment: string;
}

export interface RecordStorageProvider {
  store(payload: Uint8Array): Promise<RecordLocator>;
  retrieve(locator: RecordLocator): Promise<Uint8Array>;
}

export class CommitmentMismatchError extends Error {
  constructor(
    readonly expectedCommitment: string,
    readonly actualCommitment: string,
    readonly locator: RecordLocator,
  ) {
    super(
      `Stored record commitment mismatch: expected ${expectedCommitment}, got ${actualCommitment}`,
    );
    this.name = "CommitmentMismatchError";
  }
}
