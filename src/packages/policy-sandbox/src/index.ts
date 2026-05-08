import type {
  ApprovalBroker,
  ApprovalDecision,
  ApprovalRequest,
  PolicyDecision,
  PolicyEngine,
  PolicyRequest,
  SandboxEvent,
  SandboxRequest,
  SandboxRuntime
} from "@deepseek/platform-contracts";

export class DefaultPolicyEngine implements PolicyEngine {
  async decide(request: PolicyRequest): Promise<PolicyDecision> {
    const sideEffect = request.metadata.sideEffect;
    if (sideEffect === "write" || sideEffect === "network" || sideEffect === "process") {
      return {
        action: "deny",
        reason: `Side effect ${String(sideEffect)} is not allowed by deterministic policy`,
        audit: { policy: "deterministic-development", resource: request.resource },
        sandboxProfile: "development-denied"
      };
    }
    if (request.action.includes("delete") || request.action.includes("secret")) {
      return { action: "ask", reason: "Potentially sensitive action requires approval", audit: { policy: "default" }, sandboxProfile: "development" };
    }
    if (request.resource.includes("untrusted")) {
      return { action: "quarantine", reason: "Untrusted resource", audit: { policy: "default" }, sandboxProfile: "development-quarantine" };
    }
    return {
      action: "allow",
      reason: "Default development policy",
      audit: { policy: "deterministic-development", resource: request.resource },
      sandboxProfile: "development"
    };
  }
}

export class HeadlessApprovalBroker implements ApprovalBroker {
  constructor(private readonly defaultApproved = false) {}

  async requestApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
    return {
      approved: this.defaultApproved,
      reason: this.defaultApproved ? `Approved: ${request.prompt}` : `Denied by headless default: ${request.prompt}`
    };
  }
}

export class DevelopmentSandboxRuntime implements SandboxRuntime {
  async *run(request: SandboxRequest): AsyncIterable<SandboxEvent> {
    yield {
      kind: "recorded",
      mode: "development",
      metadata: {
        command: request.command,
        args: request.args,
        controls: request.controls,
        enforcement: "not-production"
      }
    };
  }
}
