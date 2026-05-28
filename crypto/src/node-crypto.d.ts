declare module "node:crypto" {
  export interface CipherGCM {
    update(data: Uint8Array): Uint8Array;
    final(): Uint8Array;
    getAuthTag(): Uint8Array;
  }

  export interface DecipherGCM {
    update(data: Uint8Array): Uint8Array;
    final(): Uint8Array;
    setAuthTag(tag: Uint8Array): void;
  }

  export interface Hash {
    update(data: string | Uint8Array): Hash;
    digest(encoding: "hex"): string;
  }

  export function createCipheriv(
    algorithm: "aes-256-gcm",
    key: Uint8Array,
    iv: Uint8Array,
  ): CipherGCM;

  export function createDecipheriv(
    algorithm: "aes-256-gcm",
    key: Uint8Array,
    iv: Uint8Array,
  ): DecipherGCM;

  export function createHash(algorithm: "sha256"): Hash;

  export function randomBytes(size: number): Uint8Array;
}

declare const Buffer: {
  from(
    value: string,
    encoding?: "base64url" | "base64" | "hex" | "utf8",
  ): Uint8Array;
  from(value: Uint8Array): {
    toString(encoding: "base64url" | "base64" | "hex" | "utf8"): string;
  };
  concat(chunks: Uint8Array[]): Uint8Array;
};
