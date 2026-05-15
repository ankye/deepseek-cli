import { platformContractsArePure } from "./contracts.mjs";
import { noDirectContextProjectionBypass } from "./context-projection.mjs";
import { noPrivateExecutorChaining } from "./executor-chaining.mjs";
import { noDirectGovernedExecutionBypass } from "./governed-execution.mjs";
import { noLegacyHookSystemApi } from "./hook-system.mjs";
import { noAppToAppImports, noCrossPackageRelativeImports, noInternalPackageSrcImports } from "./imports.mjs";
import { noLegacyMcpGatewayApi } from "./mcp-gateway.mjs";
import { modelGatewayStaysAnAdapter } from "./model-gateway.mjs";
import { packageJsonBoundaryRule } from "./package-json.mjs";
import { noDirectPlatformPrimitiveAccess } from "./platform.mjs";
import { noDirectProviderCredentialAccess } from "./provider.mjs";
import { promptAssemblyStaysHostNeutral } from "./prompt-assembly.mjs";
import { noLegacyRuntimeDirectExecution, runtimeDoesNotDependOnTesting } from "./runtime.mjs";
import { noDirectSecretSandboxBypass } from "./secret-sandbox.mjs";
import { noLegacySkillSystemApi } from "./skill-system.mjs";
import { centralFileScaleGuardrail } from "./scale-guardrails.mjs";

export const architectureRules = [
  noCrossPackageRelativeImports,
  noInternalPackageSrcImports,
  noAppToAppImports,
  platformContractsArePure,
  runtimeDoesNotDependOnTesting,
  noLegacyRuntimeDirectExecution,
  noPrivateExecutorChaining,
  noDirectContextProjectionBypass,
  noDirectGovernedExecutionBypass,
  noLegacyHookSystemApi,
  noLegacyMcpGatewayApi,
  modelGatewayStaysAnAdapter,
  noDirectPlatformPrimitiveAccess,
  noDirectProviderCredentialAccess,
  promptAssemblyStaysHostNeutral,
  noDirectSecretSandboxBypass,
  noLegacySkillSystemApi,
  centralFileScaleGuardrail,
  packageJsonBoundaryRule
];
