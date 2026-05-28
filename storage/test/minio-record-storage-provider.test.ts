import { describe, expect, test } from "bun:test";
import {
  CommitmentMismatchError,
  MinioRecordStorageProvider,
  type MinioClientLike,
} from "../src/index";

class MemoryMinioClient implements MinioClientLike {
  readonly buckets = new Set<string>();
  readonly objects = new Map<string, Uint8Array>();

  async bucketExists(bucketName: string): Promise<boolean> {
    return this.buckets.has(bucketName);
  }

  async makeBucket(bucketName: string): Promise<void> {
    this.buckets.add(bucketName);
  }

  async putObject(
    bucketName: string,
    objectName: string,
    payload: Uint8Array,
  ): Promise<void> {
    this.objects.set(`${bucketName}/${objectName}`, new Uint8Array(payload));
  }

  async getObject(bucketName: string, objectName: string): Promise<Uint8Array> {
    const payload = this.objects.get(`${bucketName}/${objectName}`);

    if (payload === undefined) {
      throw new Error(`Missing object ${bucketName}/${objectName}`);
    }

    return new Uint8Array(payload);
  }

  tamper(locator: string, payload: Uint8Array): void {
    const objectPath = locator.slice("s3://".length);
    this.objects.set(objectPath, payload);
  }
}

describe("MinioRecordStorageProvider", () => {
  test("stores content-addressed bytes and verifies them on retrieval", async () => {
    const client = new MemoryMinioClient();
    const provider = new MinioRecordStorageProvider({ client });
    const payload = new TextEncoder().encode("encrypted clinical payload");

    const locator = await provider.store(payload);
    const retrieved = await provider.retrieve(locator);

    expect(client.buckets.has("medichain-records")).toBe(true);
    expect(locator.locatorType).toBe("s3");
    expect(locator.locator).toBe(
      `s3://medichain-records/records/${locator.contentCommitment}`,
    );
    expect(new TextDecoder().decode(retrieved)).toBe(
      "encrypted clinical payload",
    );
  });

  test("throws CommitmentMismatchError for tampered blobs", async () => {
    const client = new MemoryMinioClient();
    const provider = new MinioRecordStorageProvider({ client });
    const locator = await provider.store(new TextEncoder().encode("original"));

    client.tamper(locator.locator, new TextEncoder().encode("tampered"));

    await expect(provider.retrieve(locator)).rejects.toBeInstanceOf(
      CommitmentMismatchError,
    );
  });
});
