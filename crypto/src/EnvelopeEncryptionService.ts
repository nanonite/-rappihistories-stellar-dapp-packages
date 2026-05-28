import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const AES_256_GCM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;

export interface EnvelopeEncryptionResult {
  ciphertext: string;
  wrappedKey: string;
  keyId: string;
}

export interface EnvelopeEncryptionServiceOptions {
  masterKey: string | Uint8Array;
  keyId?: string;
}

interface EncodedEnvelope {
  iv: Uint8Array;
  authTag: Uint8Array;
  encryptedData: Uint8Array;
}

export class EnvelopeEncryptionService {
  private readonly masterKey: Uint8Array;
  private readonly keyId: string;

  constructor(options: EnvelopeEncryptionServiceOptions) {
    this.masterKey = decodeMasterKey(options.masterKey);
    this.keyId = options.keyId ?? "local-master-key";
  }

  encrypt(plaintext: string | Uint8Array): EnvelopeEncryptionResult {
    const dek = randomBytes(KEY_BYTES);

    return {
      ciphertext: encryptWithKey(toBytes(plaintext), dek),
      wrappedKey: encryptWithKey(dek, this.masterKey),
      keyId: this.keyId,
    };
  }

  decrypt(ciphertext: string, wrappedKey: string): string {
    const dek = decryptWithKey(wrappedKey, this.masterKey);
    const plaintext = decryptWithKey(ciphertext, dek);
    return Buffer.from(plaintext).toString("utf8");
  }
}

function decodeMasterKey(masterKey: string | Uint8Array): Uint8Array {
  const key =
    typeof masterKey === "string" ? Buffer.from(masterKey, "base64") : masterKey;

  if (key.byteLength !== KEY_BYTES) {
    throw new Error("Master key must be 32 bytes for AES-256-GCM");
  }

  return key;
}

function toBytes(value: string | Uint8Array): Uint8Array {
  return typeof value === "string" ? Buffer.from(value, "utf8") : value;
}

function encryptWithKey(plaintext: Uint8Array, key: Uint8Array): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(AES_256_GCM, key, iv);
  const encryptedData = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return encodeEnvelope({ iv, authTag, encryptedData });
}

function decryptWithKey(envelope: string, key: Uint8Array): Uint8Array {
  const { iv, authTag, encryptedData } = decodeEnvelope(envelope);
  const decipher = createDecipheriv(AES_256_GCM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

function encodeEnvelope(envelope: EncodedEnvelope): string {
  return [
    Buffer.from(envelope.iv).toString("base64url"),
    Buffer.from(envelope.authTag).toString("base64url"),
    Buffer.from(envelope.encryptedData).toString("base64url"),
  ].join(".");
}

function decodeEnvelope(envelope: string): EncodedEnvelope {
  const parts = envelope.split(".");

  if (parts.length !== 3) {
    throw new Error("Encrypted envelope must contain iv, auth tag, and payload");
  }

  const [iv, authTag, encryptedData] = parts;

  return {
    iv: Buffer.from(iv, "base64url"),
    authTag: Buffer.from(authTag, "base64url"),
    encryptedData: Buffer.from(encryptedData, "base64url"),
  };
}
