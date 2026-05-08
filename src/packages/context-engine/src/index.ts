import type { ContextEngine, ContextNode, SessionId } from "@deepseek/platform-contracts";

export class InMemoryContextEngine implements ContextEngine {
  private readonly nodes = new Map<string, ContextNode[]>();

  async addNode(sessionId: SessionId, node: ContextNode): Promise<void> {
    const current = this.nodes.get(sessionId) ?? [];
    current.push(node);
    this.nodes.set(sessionId, current);
  }

  async project(sessionId: SessionId, prompt: string) {
    const nodes = this.nodes.get(sessionId) ?? [];
    return {
      prompt: [...nodes.map((node) => node.content), prompt].join("\n"),
      nodes
    };
  }
}
