## 1. Contracts And Capability Matrix / 契约与能力矩阵

- [x] 1.1 Add platform descriptor, environment kind, provider status, provider result metadata, and degraded-mode contracts to `@deepseek/platform-contracts`. / 在 `@deepseek/platform-contracts` 增加 platform descriptor、environment kind、provider status、provider result metadata 和 degraded-mode contracts。
- [x] 1.2 Add shell provider, search provider, process provider, path translation, secure-storage capability, native capability probe, and watcher capability contracts. / 增加 shell provider、search provider、process provider、path translation、secure-storage capability、native capability probe 和 watcher capability contracts。
- [x] 1.3 Add policy-facing platform execution context fields for shell profile, provider selection, native capability, and platform descriptor. / 增加面向 policy 的 platform execution context fields，覆盖 shell profile、provider selection、native capability 和 platform descriptor。

## 2. Platform Runtime Implementation / 平台运行时实现

- [x] 2.1 Extend `NodePlatformRuntime` to report macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell descriptors. / 扩展 `NodePlatformRuntime`，报告 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell descriptors。
- [x] 2.2 Implement semantic search provider selection with selected provider, fallback chain, timeout policy, and degradation metadata. / 实现 semantic search provider selection，包含 selected provider、fallback chain、timeout policy 和 degradation metadata。
- [x] 2.3 Implement explicit shell provider resolution for bash, PowerShell, unavailable shell, and no-shell host modes. / 实现 bash、PowerShell、unavailable shell 和 no-shell host modes 的显式 shell provider resolution。
- [x] 2.4 Implement secure-storage and native capability probes as structured availability diagnostics without loading native modules from non-owner packages. / 以 structured availability diagnostics 实现 secure-storage 和 native capability probes，禁止 non-owner packages 加载 native modules。
- [x] 2.5 Ensure path resolution, path translation, process execution, and provider selection fail closed without upper-layer fallback path construction. / 确保 path resolution、path translation、process execution 和 provider selection fail closed，且不允许上层构造 fallback path。

## 3. Policy, Readiness, And Host Integration / 策略、可用性与 Host 集成

- [x] 3.1 Update policy/sandbox contracts and deterministic policy implementation to consume platform execution context before scheduling. / 更新 policy/sandbox contracts 和 deterministic policy implementation，使其在 scheduling 前消费 platform execution context。
- [x] 3.2 Update readiness/doctor platform checks to display platform descriptor, selected providers, fallback reasons, degraded modes, and no-shell/native-unavailable diagnostics. / 更新 readiness/doctor platform checks，展示 platform descriptor、selected providers、fallback reasons、degraded modes 和 no-shell/native-unavailable diagnostics。
- [x] 3.3 Keep CLI and VSCode host adapters thin by injecting platform descriptors and provider diagnostics through shared contracts. / 通过共享 contracts 注入 platform descriptors 和 provider diagnostics，保持 CLI 与 VSCode host adapters 轻量。

## 4. Lint And Boundary Enforcement / Lint 与边界强制

- [x] 4.1 Add lint conventions for platform-owner packages and forbidden direct OS/process/search/secure-storage/native access. / 增加 platform-owner packages 与 forbidden direct OS/process/search/secure-storage/native access 的 lint conventions。
- [x] 4.2 Add AST lint rules and negative tests for direct `process.platform`, `node:child_process`, search binary invocation, secure-storage API access, and native module loading outside approved owners. / 增加 AST lint rules 和 negative tests，覆盖 approved owners 之外直接使用 `process.platform`、`node:child_process`、search binary invocation、secure-storage API access 和 native module loading。
- [x] 4.3 Add package boundary tests proving hosts and feature packages use platform contracts instead of platform implementation internals. / 增加 package boundary tests，证明 hosts 和 feature packages 使用 platform contracts，而不是 platform implementation internals。

## 5. Tests And Acceptance / 测试与验收

- [x] 5.1 Add fake platform matrix fixtures for macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell. / 增加 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell 的 fake platform matrix fixtures。
- [x] 5.2 Add matrix tests for path rejection, WSL translation, search fallback, shell unavailable, native unavailable, secure-storage unavailable, and provider metadata. / 增加 path rejection、WSL translation、search fallback、shell unavailable、native unavailable、secure-storage unavailable 和 provider metadata 的 matrix tests。
- [x] 5.3 Add contract tests for descriptor shape, provider result metadata, fail-closed diagnostics, and policy execution context. / 增加 descriptor shape、provider result metadata、fail-closed diagnostics 和 policy execution context 的 contract tests。
- [x] 5.4 Add e2e/readiness tests proving doctor stays offline while reporting platform degradation and fallback metadata. / 增加 e2e/readiness tests，证明 doctor 保持离线，同时报告 platform degradation 和 fallback metadata。
- [x] 5.5 Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:contracts`, `npm run test:integration`, `npm run test:matrix`, `npm run test:e2e`, and OpenSpec strict validation. / 运行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run test:contracts`、`npm run test:integration`、`npm run test:matrix`、`npm run test:e2e` 和 OpenSpec strict validation。
