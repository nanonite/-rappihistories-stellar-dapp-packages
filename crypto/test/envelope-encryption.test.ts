import { describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import {
  CommitmentService,
  EnvelopeEncryptionService,
} from "../src/index";

describe("EnvelopeEncryptionService", () => {
  test("encrypts, commits, stores, retrieves, verifies, and decrypts a clinical payload", () => {
    const service = new EnvelopeEncryptionService({
      masterKey: randomBytes(32),
      keyId: "kms-local-1",
    });
    const plaintext = JSON.stringify({
      patientPseudonym: "patient-123",
      recordType: "lab",
      value: "sensitive payload",
    });
    const storage = new Map<string, string>();

    const encrypted = service.encrypt(plaintext);
    const commitment = CommitmentService.sha256Hex(encrypted.ciphertext);
    storage.set(commitment, encrypted.ciphertext);

    const retrievedCiphertext = storage.get(commitment);

    expect(retrievedCiphertext).toBe(encrypted.ciphertext);
    expect(CommitmentService.sha256Hex(retrievedCiphertext ?? "")).toBe(
      commitment,
    );
    expect(service.decrypt(encrypted.ciphertext, encrypted.wrappedKey)).toBe(
      plaintext,
    );
    expect(encrypted.keyId).toBe("kms-local-1");
    expect(encrypted.ciphertext).not.toContain(plaintext);
  });
});
