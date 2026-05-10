import type { JsonObject, KernelError, ToolIntentDiagnostic } from "@deepseek/platform-contracts";
import { redactJsonSecrets } from "@deepseek/policy-sandbox";

export function redactSecretTextForRuntime(value: string): string {
  return redactJsonSecrets(value) as string;
}

export function kernelError(code: KernelError["code"], message: string, details: JsonObject = {}): KernelError {
  return {
    code,
    message: redactSecretTextForRuntime(message),
    retryable: false,
    redaction: { class: "public" },
    details: redactJsonSecrets(details) as JsonObject
  };
}

export function toolIntentError(diagnostics: readonly ToolIntentDiagnostic[]): KernelError {
  const first = diagnostics[0];
  return kernelError("KERNEL_ENVELOPE_INVALID", first?.message ?? "Tool intent preflight failed", {
    code: first?.code ?? "TOOL_INTENT_REJECTED",
    field: first?.field ?? ""
  });
}
