import type { PromptSectionProviderRegistration } from "./assembler.js";
import { createContextProviders } from "./providers/context.js";
import { createEvidenceFirstProviders } from "./providers/evidence-first.js";
import { createModeProviders } from "./providers/mode.js";
import { createSelfRepairProviders } from "./providers/self-repair.js";
import { createToolPolicyProvider } from "./providers/tool-policy.js";
import { createUserPromptProvider } from "./providers/user.js";
import { createTaskOutputContractProvider } from "./providers/webpage.js";

export function defaultPromptSectionProviders(): readonly PromptSectionProviderRegistration[] {
  return [
    createUserPromptProvider(),
    ...createModeProviders(),
    ...createEvidenceFirstProviders(),
    ...createSelfRepairProviders(),
    ...createContextProviders(),
    createTaskOutputContractProvider(),
    createToolPolicyProvider()
  ];
}
