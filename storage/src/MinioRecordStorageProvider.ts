import { createHash } from "node:crypto";
import {
  CommitmentMismatchError,
  type RecordLocator,
  type RecordStorageProvider,
} from "./RecordStorageProvider";

const DEFAULT_BUCKET_NAME = "medichain-records";

export interface MinioClientLike {
  bucketExists(bucketName: string): Promise<boolean>;
  makeBucket(bucketName: string): Promise<unknown>;
  putObject(
    bucketName: string,
    objectName: string,
    payload: Uint8Array,
  ): Promise<unknown>;
  getObject(bucketName: string, objectName: string): Promise<unknown>;
}

export interface MinioRecordStorageProviderOptions {
  client: MinioClientLike;
  bucketName?: string;
}

export class MinioRecordStorageProvider implements RecordStorageProvider {
  private bucketReady = false;
  private readonly bucketName: string;
  private readonly client: MinioClientLike;

  constructor(options: MinioRecordStorageProviderOptions) {
    this.client = options.client;
    this.bucketName = options.bucketName ?? DEFAULT_BUCKET_NAME;
  }

  async store(payload: Uint8Array): Promise<RecordLocator> {
    await this.ensureBucket();

    const contentCommitment = sha256Hex(payload);
    const objectKey = objectKeyForCommitment(contentCommitment);
    await this.client.putObject(this.bucketName, objectKey, payload);

    return {
      locatorType: "s3",
      locator: toS3Locator(this.bucketName, objectKey),
      contentCommitment,
    };
  }

  async retrieve(locator: RecordLocator): Promise<Uint8Array> {
    const { bucketName, objectKey } = parseS3Locator(locator);
    const object = await this.client.getObject(bucketName, objectKey);
    const payload = await toUint8Array(object);
    const actualCommitment = sha256Hex(payload);

    if (actualCommitment !== locator.contentCommitment) {
      throw new CommitmentMismatchError(
        locator.contentCommitment,
        actualCommitment,
        locator,
      );
    }

    return payload;
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) {
      return;
    }

    const exists = await this.client.bucketExists(this.bucketName);
    if (!exists) {
      await this.client.makeBucket(this.bucketName);
    }

    this.bucketReady = true;
  }
}

function sha256Hex(payload: Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

function objectKeyForCommitment(contentCommitment: string): string {
  return `records/${contentCommitment}`;
}

function toS3Locator(bucketName: string, objectKey: string): string {
  return `s3://${bucketName}/${objectKey}`;
}

function parseS3Locator(locator: RecordLocator): {
  bucketName: string;
  objectKey: string;
} {
  if (locator.locatorType !== "s3") {
    throw new Error(`Unsupported record locator type: ${locator.locatorType}`);
  }

  if (!locator.locator.startsWith("s3://")) {
    throw new Error("S3 record locator must start with s3://");
  }

  const path = locator.locator.slice("s3://".length);
  const separatorIndex = path.indexOf("/");

  if (separatorIndex <= 0 || separatorIndex === path.length - 1) {
    throw new Error("S3 record locator must include bucket and object key");
  }

  return {
    bucketName: path.slice(0, separatorIndex),
    objectKey: path.slice(separatorIndex + 1),
  };
}

async function toUint8Array(value: unknown): Promise<Uint8Array> {
  if (value instanceof Uint8Array) {
    return new Uint8Array(value);
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (isArrayBufferProvider(value)) {
    return new Uint8Array(await value.arrayBuffer());
  }

  if (isAsyncByteIterable(value)) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of value) {
      chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
    }
    return concatUint8Arrays(chunks);
  }

  throw new Error("MinIO object payload must be bytes or an async byte stream");
}

interface ArrayBufferProvider {
  arrayBuffer(): Promise<ArrayBuffer>;
}

function isArrayBufferProvider(value: unknown): value is ArrayBufferProvider {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function";
}

function isAsyncByteIterable(
  value: unknown,
): value is AsyncIterable<Uint8Array | ArrayBuffer> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof (value as { [Symbol.asyncIterator]?: unknown })[
      Symbol.asyncIterator
    ] === "function"
  );
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}
