## ADDED Requirements

### Requirement: Provider Tool Family Capability Metadata / Provider 工具家族能力元数据
The model gateway SHALL expose provider capability metadata for client-side tools, server-side tools, web search, browser/native tools, image/media operations, structured output, streaming, and tool-result continuation semantics.

model gateway 必须暴露 provider capability metadata，覆盖 client-side tools、server-side tools、web search、browser/native tools、image/media operations、structured output、streaming 与 tool-result continuation semantics。

#### Scenario: Unsupported media family is explicit / 不支持 Media Family 必须显式
- **WHEN** the active provider profile does not support image generation or image editing
- **THEN** model gateway capability metadata marks `image.generate` and `image.edit` unsupported for provider-native projection
- **中文** 当 active provider profile 不支持 image generation 或 image editing 时，model gateway capability metadata 必须标记 `image.generate` 与 `image.edit` 不支持 provider-native projection。

### Requirement: Provider Projection Does Not Hide Local Families / Provider 投影不得隐藏本地 Family
Provider capability limits SHALL affect projection and execution readiness but SHALL NOT remove catalog families from scorecard denominators.

provider capability limits 可以影响 projection 与 execution readiness，但不得从 scorecard denominators 中移除 catalog families。

#### Scenario: Provider lacks browser support / Provider 缺少 Browser 支持
- **WHEN** a provider lacks native browser tools but DeepSeek has a local browser connector planned or absent
- **THEN** the browser families remain visible with provider support and local implementation status reported separately
- **中文** 当 provider 缺少 native browser tools，而 DeepSeek 的 local browser connector 为 planned 或 absent 时，browser families 必须保持可见，并分别报告 provider support 与 local implementation status。

### Requirement: Tool Continuation Is Family-Aware / 工具回灌感知 Family
Tool-result continuation events SHALL include family id and domain id so runtime, diagnostics, and scorecards can attribute provider/tool feedback to the correct family.

工具结果回灌事件必须包含 family id 与 domain id，使 runtime、diagnostics 与 scorecards 能将 provider/tool feedback 归因到正确 family。

#### Scenario: Feedback carries family id / 回灌携带 Family ID
- **WHEN** runtime returns a `browser.screenshot` result to the model
- **THEN** the continuation metadata includes the `browser.screenshot` family id
- **中文** 当 runtime 将 `browser.screenshot` result 回灌给模型时，continuation metadata 必须包含 `browser.screenshot` family id。
