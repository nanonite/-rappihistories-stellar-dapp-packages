import { createHash } from "node:crypto";

export class CommitmentService {
  static sha256Hex(payload: string | Uint8Array): string {
    return createHash("sha256").update(payload).digest("hex");
  }
}
