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
- Raw secret fixture did not appear in stdout or stream-json.
```

## Rule / 规则

Evidence must be concise and reproducible. Do not paste full logs unless the log itself is the artifact under review.

证据应简洁且可复现。除非日志本身是被审查产物，否则不要粘贴完整日志。
