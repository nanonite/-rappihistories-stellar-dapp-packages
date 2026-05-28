export const STORAGE_PACKAGE_VERSION = "0.1.0";

export {
  CommitmentMismatchError,
} from "./RecordStorageProvider";
export type {
  RecordLocator,
  RecordLocatorType,
  RecordStorageProvider,
} from "./RecordStorageProvider";
export {
  MinioRecordStorageProvider,
} from "./MinioRecordStorageProvider";
export type {
  MinioClientLike,
  MinioRecordStorageProviderOptions,
} from "./MinioRecordStorageProvider";
