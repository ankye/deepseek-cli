import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { FileSnapshot, WorkspaceEditTransaction, WorkspaceIdentity, WorkspaceStateManager } from "@deepseek/platform-contracts";
import { asId } from "@deepseek/platform-contracts";

export class InMemoryWorkspaceStateManager implements WorkspaceStateManager {
  private readonly transactions: WorkspaceEditTransaction[] = [];

  async identify(roots: readonly string[]): Promise<WorkspaceIdentity> {
    return {
      id: asId<"workspace">(`workspace-${createHash("sha1").update(roots.join("|")).digest("hex").slice(0, 8)}`),
      roots,
      trusted: true
    };
  }

  async snapshot(path: string): Promise<FileSnapshot> {
    const content = await readFile(path, "utf8").catch(() => "");
    return {
      path,
      contentHash: createHash("sha1").update(content).digest("hex"),
      capturedAt: new Date(0).toISOString()
    };
  }

  async transact(transaction: WorkspaceEditTransaction): Promise<void> {
    this.transactions.push(transaction);
  }
}
