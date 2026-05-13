## Why

R3 extension management now exposes plugins, skills, MCP, credentials, and command surfaces, but slash commands, skill activations, hooks, workflow suggestions, and dynamic contributions still lack one canonical composition model. Without that model, CLI and future hosts will drift into string-based routing, duplicate help projections, and legacy contribution compatibility paths.

R3 extension management 已经暴露 plugins、skills、MCP、credentials 和 command surfaces，但 slash commands、skill activations、hooks、workflow suggestions 与 dynamic contributions 还缺少一个规范组合模型。没有这个模型，CLI 和后续 hosts 容易滑向字符串路由、重复 help projection 和旧式 contribution 兼容路径。

## What Changes

- Add a command/skill/hook composition capability that normalizes slash commands, built-in commands, skills, hooks, MCP prompts/tools, plugin commands, and workflow suggestions into versioned composition records. / 增加 command/skill/hook composition 能力，将 slash commands、built-in commands、skills、hooks、MCP prompts/tools、plugin commands 和 workflow suggestions 归一为版本化 composition records。
- Extend command contracts with stable contribution source, owner subsystem, permissions, side-effect metadata, compatibility, and projection fields. / 扩展 command contracts，增加 stable contribution source、owner subsystem、permissions、side-effect metadata、compatibility 和 projection fields。
- Add deterministic composition projection APIs for CLI help, chat slash commands, model-visible commands, and extension-contributed commands without invoking owners. / 增加确定性 composition projection APIs，用于 CLI help、chat slash commands、model-visible commands 和 extension-contributed commands，且不执行 owner。
- Add tests that reject legacy ad-hoc registration, duplicate aliases, unsafe side-effect projection, and contribution records without schema versions. / 增加测试，拒绝 legacy ad-hoc registration、重复 aliases、不安全 side-effect projection 和缺少 schema version 的 contribution records。
- Update docs and roadmap so R3 proceeds through composition stabilization before host promotion. / 更新文档和路线图，使 R3 在 host promotion 前完成 composition stabilization。

## Capabilities

### New Capabilities

- `command-skill-hook-composition`: canonical composition records, contribution normalization, projection APIs, collision handling, result-list targets, and deterministic regression coverage for command/skill/hook/workflow/MCP/plugin contributions. / 规范 composition records、contribution normalization、projection APIs、collision handling、result-list targets，以及 command/skill/hook/workflow/MCP/plugin contributions 的确定性回归覆盖。

### Modified Capabilities

- `command-system`: command manifests gain owner, source, permissions, compatibility, projection, and composition metadata. / command manifests 增加 owner、source、permissions、compatibility、projection 和 composition metadata。
- `skill-system`: skill summaries and activations must contribute to composition projections without loading full content by default. / skill summaries 与 activations 必须可贡献到 composition projections，默认不加载完整内容。
- `hook-system`: hook summaries and lifecycle points must be projectable as ordered composition records without invoking hooks. / hook summaries 与 lifecycle points 必须可作为有序 composition records 投影，且不触发 hook invocation。
- `extension-system`: extension contribution summaries must feed the composition registry through manifest metadata only. / extension contribution summaries 必须只通过 manifest metadata 输入 composition registry。
- `plugin-system`: plugin command/skill/hook/MCP contributions must preserve plugin provenance and permission metadata in composition records. / plugin command/skill/hook/MCP contributions 必须在 composition records 中保留 plugin provenance 与 permission metadata。
- `mcp-gateway`: MCP prompts/tools exposed to command composition must remain inert metadata until the gateway executes a governed call. / 暴露给 command composition 的 MCP prompts/tools 必须保持惰性 metadata，直到 gateway 执行受治理调用。
- `testing-regression`: regression coverage must include composition projection parity, collision handling, schema versioning, and reference pit ids. / regression coverage 必须包含 composition projection parity、collision handling、schema versioning 和 reference pit ids。

## Impact

- Affects `@deepseek/platform-contracts` command/composition DTOs and public exports. / 影响 `@deepseek/platform-contracts` 的 command/composition DTOs 与 public exports。
- Affects `@deepseek/command-system` implementation and tests, keeping `index.ts` as an export surface. / 影响 `@deepseek/command-system` implementation 与 tests，并保持 `index.ts` 为导出面。
- Adds or updates contract/integration tests for composition projection, slash command help, dynamic contribution normalization, alias collision, and no execution on projection. / 增加或更新 composition projection、slash command help、dynamic contribution normalization、alias collision 和 projection 不执行的 contract/integration tests。
- Updates CLI README and product roadmap only for documented R3 sequencing. / 仅为 R3 sequencing 更新 CLI README 和产品路线。
- Does not implement a full command palette, Vim keybindings, workflow executor, marketplace, VSCode projection, or remote/server host behavior in this pack. / 本包不实现 full command palette、Vim keybindings、workflow executor、marketplace、VSCode projection 或 remote/server host behavior。
