import type { JsonObject } from "./common.js";
import type { ContextNodeId, SessionId } from "./ids.js";

export type ContextNodeKind = "user" | "assistant" | "tool-result" | "rule" | "summary" | "file" | "diagnostic" | "memory-ref";

export interface ContextNode {
  readonly id: ContextNodeId;
  readonly kind: ContextNodeKind;
  readonly content: string;
  readonly metadata: JsonObject;
}

export interface ContextGraph {
  readonly sessionId: SessionId;
  readonly nodes: readonly ContextNode[];
}

export interface ContextProjection {
  readonly prompt: string;
  readonly nodes: readonly ContextNode[];
}

export interface ContextEngine {
  addNode(sessionId: SessionId, node: ContextNode): Promise<void>;
  project(sessionId: SessionId, prompt: string): Promise<ContextProjection>;
}
