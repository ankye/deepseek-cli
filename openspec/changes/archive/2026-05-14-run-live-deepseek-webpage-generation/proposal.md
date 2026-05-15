# Change: Run live DeepSeek webpage generation

## Why

The evaluation lane can execute isolated webpage-generation tasks, but the DeepSeek-owned baseline still runs without `--live`, so it exercises the deterministic mock model instead of proving the real DeepSeek tool loop can create HTML/CSS/JS artifacts. This blocks meaningful DeepSeek-vs-Codex-vs-Claude comparison because our own baseline does not yet complete the actual product flow.

评估通道已经能在隔离 workspace 中执行网页生成任务，但 DeepSeek 自有 baseline 仍未传入 `--live`，因此跑的是 deterministic mock model，而不是证明真实 DeepSeek tool loop 可以创建 HTML/CSS/JS 产物。这会阻塞 DeepSeek 与 Codex、Claude 的有效对比，因为自有 baseline 尚未跑通真实产品流程。

## What Changes

- Allow `diagnostics evaluate --live --full --execute-task eval.webpage.generation` to execute the DeepSeek CLI baseline through the live provider path.
- Keep live execution opt-in; default diagnostics evaluation remains deterministic and offline.
- Project write-capable local tools for the webpage task so the model can create `generated-webpage` artifacts inside the isolated workspace.
- Strengthen the webpage-generation prompt with explicit file-writing, local-only dependency, and checker-facing requirements.
- Add deterministic tests that prove live intent is propagated without making network calls.

- 允许 `diagnostics evaluate --live --full --execute-task eval.webpage.generation` 通过 live provider 路径执行 DeepSeek CLI baseline。
- 保持 live execution 显式 opt-in；默认 diagnostics evaluation 仍然 deterministic 且 offline。
- 为网页生成任务投影 write-capable local tools，使模型能在隔离 workspace 内创建 `generated-webpage` 产物。
- 强化 webpage-generation prompt，明确文件写入、本地依赖与 checker-facing 要求。
- 增加确定性测试，证明 live intent 已透传但不触发网络调用。

## Impact

- Affected CLI parser/diagnostics: live flag handling for `diagnostics evaluate`.
- Affected evaluation runner: DeepSeek baseline command construction and artifact task prompt.
- Affected tests: CLI evaluation tests and focused live-flow smoke.
- No default CI live calls; live provider calls remain opt-in through `--live` and credentials.

- 影响 CLI parser/diagnostics：`diagnostics evaluate` 的 live flag handling。
- 影响 evaluation runner：DeepSeek baseline command construction 与 artifact task prompt。
- 影响 tests：CLI evaluation tests 与 focused live-flow smoke。
- 默认 CI 不调用 live；live provider calls 仍需 `--live` 与 credentials 显式开启。