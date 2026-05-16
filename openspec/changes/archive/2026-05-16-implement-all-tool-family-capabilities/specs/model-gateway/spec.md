## ADDED Requirements

### Requirement: Provider Families Use Capability Metadata / Provider Families 使用能力元数据
The model gateway SHALL expose provider support metadata for web extraction, structured data lookup, image generation, image editing, stock search, browser/native tools, structured output, and continuation semantics.

model gateway 必须暴露 provider support metadata，覆盖 web extraction、structured data lookup、image generation、image editing、stock search、browser/native tools、structured output 与 continuation semantics。

#### Scenario: Fake image provider does not claim native support / Fake Image Provider 不声称 Native Support
- **WHEN** `image.generate` runs through the deterministic fake provider
- **THEN** score evidence records fake/replayed execution and provider-native support remains separate
- **中文** 当 `image.generate` 通过 deterministic fake provider 执行时，score evidence 必须记录 fake/replayed execution，并且 provider-native support 必须单独报告。

### Requirement: Tool Continuation Carries Family Identity / Tool 回灌携带 Family 身份
Provider-neutral tool result continuation SHALL include family id, domain id, tool id, artifact references, truncation metadata, and redaction metadata.

provider-neutral tool result continuation 必须包含 family id、domain id、tool id、artifact references、truncation metadata 与 redaction metadata。

#### Scenario: Image edit feedback is attributable / Image Edit 回灌可归因
- **WHEN** an image edit tool returns an artifact to the model
- **THEN** the continuation metadata attributes the result to `image.edit`
- **中文** 当 image edit tool 把 artifact 返回给模型时，continuation metadata 必须把结果归因到 `image.edit`。
