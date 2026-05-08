import { platformContractsArePure } from "./contracts.mjs";
import { noDirectGovernedExecutionBypass } from "./governed-execution.mjs";
import { noAppToAppImports, noCrossPackageRelativeImports, noInternalPackageSrcImports } from "./imports.mjs";
import { packageJsonBoundaryRule } from "./package-json.mjs";
import { runtimeDoesNotDependOnTesting } from "./runtime.mjs";

export const architectureRules = [
  noCrossPackageRelativeImports,
  noInternalPackageSrcImports,
  noAppToAppImports,
  platformContractsArePure,
  runtimeDoesNotDependOnTesting,
  noDirectGovernedExecutionBypass,
  packageJsonBoundaryRule
];
