# Acceptance Evidence / 验收证据

Acceptance evidence records what was validated for a change, archive, or release.

验收证据记录某个变更、归档或发布验证了什么。

## Location / 位置

```text
tests/acceptance/latest/
```

## Evidence Should Include / 证据应包含

- Change or release name. / 变更或发布名称。
- Commands run. / 运行的命令。
- Result summary. / 结果摘要。
- Test counts if available. / 可用时记录测试数量。
- Security or boundary evidence if relevant. / 相关时记录安全或边界证据。
- Explicit skips for live tests. / live tests 的显式跳过说明。

## Refresh Command / 刷新命令

For CLI release evidence, refresh before verifying:

CLI release evidence 应先刷新再验证：

```bash
deepseek diagnostics refresh --output json
deepseek diagnostics verify --output json
```

`diagnostics refresh` writes allowlisted local command output to `tests/acceptance/latest/*.txt`. Add `--dry-run` to inspect the plan without executing it, or `--full` to include contracts, integration, golden, versioning, matrix, and e2e suites.

`diagnostics refresh` 会把 allowlisted local command output 写入 `tests/acceptance/latest/*.txt`。使用 `--dry-run` 可只查看计划不执行；使用 `--full` 可额外包含 contracts、integration、golden、versioning、matrix 与 e2e suites。

## Example / 示例

```text
change-name acceptance evidence

Change validation:
- openspec validate change-name --type change --strict
- Result: passed

Default gates:
- npm run typecheck
- Result: passed

Security evidence:
- Raw secret fixture did not appear in stdout or JSONL output.
```

## Rule / 规则

Evidence must be concise and reproducible. Do not paste full logs unless the log itself is the artifact under review.

证据应简洁且可复现。除非日志本身是被审查产物，否则不要粘贴完整日志。
