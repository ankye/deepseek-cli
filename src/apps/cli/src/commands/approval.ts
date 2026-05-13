import { createCliApprovalActionRequest, resolveCliApprovalAction } from "@deepseek/platform-contracts";
import type { CliApprovalActionKind, CliApprovalActionResult, SessionId } from "@deepseek/platform-contracts";

export function runLocalApprovalAction(input: {
  readonly action: CliApprovalActionKind;
  readonly approvalId: string;
  readonly label?: string;
  readonly sessionId?: SessionId;
}): CliApprovalActionResult {
  return resolveCliApprovalAction(createCliApprovalActionRequest(input));
}

export function renderApprovalActionText(result: CliApprovalActionResult): string {
  if (!result.ok) return `[approval] ${String(result.error?.code ?? "CLI_APPROVAL_ACTION_FAILED")}`;
  if (result.action === "inspect") return `[approval] inspect ${result.target.id}`;
  return `[approval] ${result.action} ${result.target.id} -> ${result.brokerDecision ?? "unknown"}`;
}
