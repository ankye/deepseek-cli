import type { JsonObject, RuntimeEvent, VscodeHostAdapter } from "@deepseek/platform-contracts";
import { InProcessProtocolTransport } from "@deepseek/communication-protocol";

export interface VscodeLikeContext {
  readonly subscriptions?: { dispose(): unknown }[];
}

export class DeepSeekVscodeHostBridge implements VscodeHostAdapter {
  readonly context = {
    hostKind: "vscode" as const,
    capabilities: ["commands", "chat-input", "editor-context", "approvals", "workspace-edits"]
  };

  readonly transport = new InProcessProtocolTransport();
  private readonly rendered: RuntimeEvent[] = [];

  async collectEditorContext(): Promise<JsonObject> {
    return {
      activeDocument: null,
      selections: [],
      diagnostics: [],
      workspaceFolders: []
    };
  }

  async applyWorkspaceEdit(_edit: JsonObject): Promise<void> {}

  render(event: RuntimeEvent): void {
    this.rendered.push(event);
  }

  getRenderedEvents(): readonly RuntimeEvent[] {
    return [...this.rendered];
  }
}

export function activate(context: VscodeLikeContext): DeepSeekVscodeHostBridge {
  const bridge = new DeepSeekVscodeHostBridge();
  context.subscriptions?.push({ dispose: () => undefined });
  return bridge;
}

export function deactivate(): void {}
