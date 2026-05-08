import type { JsonObject } from "./common.js";
import type { ProtocolEnvelope, ProtocolTransport } from "./protocol.js";
import type { RuntimeEvent } from "./runtime.js";

export interface HostContext extends JsonObject {
  readonly hostKind: "cli" | "vscode" | "test" | "server";
  readonly workspaceRoot?: string;
  readonly capabilities: readonly string[];
}

export interface HostAdapter {
  readonly context: HostContext;
  readonly transport: ProtocolTransport;
  render(event: RuntimeEvent): Promise<void> | void;
}

export interface CliHostAdapter extends HostAdapter {
  renderText(event: RuntimeEvent): string;
  renderJson(envelope: ProtocolEnvelope): string;
}

export interface VscodeHostAdapter extends HostAdapter {
  collectEditorContext(): Promise<JsonObject>;
  applyWorkspaceEdit(edit: JsonObject): Promise<void>;
}
