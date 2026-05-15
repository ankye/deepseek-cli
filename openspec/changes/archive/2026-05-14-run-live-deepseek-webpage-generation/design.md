## Context

`collectCliEvaluation()` already isolates execution workspaces and runs a deterministic checker against `generated-webpage`. The DeepSeek adapter command currently invokes `deepseek run <prompt> --output jsonl` without `--live`, so the run only proves prompt assembly instrumentation and fake model plumbing. The fake path cannot be used as final evidence that DeepSeek can create webpage files.

`collectCliEvaluation()` 已经隔离 execution workspaces，并对 `generated-webpage` 运行 deterministic checker。当前 DeepSeek adapter command 调用的是 `deepseek run <prompt> --output jsonl`，没有 `--live`，因此只证明 prompt assembly instrumentation 与 fake model plumbing。fake path 不能作为 DeepSeek 能创建网页文件的最终证据。

## Decisions

1. **Use the existing global `--live` flag as the opt-in.**
   `diagnostics evaluate --live ...` is already parsed at top level, so no new flag is needed. The evaluation runner will receive `live: true` and only then add `--live` to the nested DeepSeek CLI process.

   **使用现有全局 `--live` flag 作为 opt-in。** `diagnostics evaluate --live ...` 已在顶层解析，因此不新增 flag。evaluation runner 接收 `live: true` 后，才给嵌套 DeepSeek CLI process 增加 `--live`。

2. **Grant write-tool visibility only for this task profile.**
   The webpage task declares `allowedCapabilityProfile: local-create-web-assets`. For DeepSeek live execution, the nested command will use a task-scoped write projection so `core.file.write` and related local file tools are model-visible. This remains constrained by isolated cwd and existing runtime policy.

   **仅对此任务 profile 开启写工具可见性。** 网页任务声明 `allowedCapabilityProfile: local-create-web-assets`。DeepSeek live execution 会对嵌套命令使用 task-scoped write projection，使 `core.file.write` 及相关本地文件工具对模型可见。该行为仍受隔离 cwd 与现有 runtime policy 约束。

3. **Keep checker as the pass/fail authority.**
   The model response text is not enough. Completion requires files under `generated-webpage` and a passing local checker.

   **仍以 checker 作为通过标准。** 模型文本不代表完成。必须在 `generated-webpage` 下生成文件，并通过本地 checker。

## Risks / Trade-offs

- **Live run cost and flakiness** -> live remains explicit and is not part of default tests.
- **Model may answer with code blocks instead of tool calls** -> prompt tells it to write files with available tools and not stop until artifacts exist.
- **Write tool exposure risk** -> execution cwd is an isolated temp workspace and tool projection is task-scoped.

- **Live run 有成本和不稳定性** -> live 保持显式开启，不进入默认 tests。
- **模型可能只输出代码块而不调用工具** -> prompt 明确要求使用可用工具写文件，并在产物存在前不要停止。
- **写工具暴露风险** -> execution cwd 是隔离 temp workspace，tool projection 按任务收窄。