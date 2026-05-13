# deepseek-agent-cli

Future-ready DeepSeek coding-agent CLI framework preview.

```bash
npm install -g deepseek-agent-cli
deepseek run "smoke"
deepseek run "smoke" --output jsonl
deepseek chat --output jsonl
deepseek chat --session <session-id> --output jsonl
deepseek diagnostics bundle --output json
deepseek diagnostics refresh --dry-run --output json
deepseek diagnostics refresh --output json
deepseek diagnostics evaluate --dry-run --output json
deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command codex --baseline-arg --version --dry-run --output json
deepseek diagnostics release --output jsonl
deepseek diagnostics verify --output json
deepseek extension list --output jsonl
deepseek extension plugin install ./plugin.json --output json
deepseek extension skill activate repo-summary --output json
deepseek extension auth scopes --output json
deepseek extension mcp test ./mcp.json --output json
deepseek index-provider status --output json
deepseek index-provider set zvec enabled --output json
deepseek revert preview --request request-id --output json
deepseek revert apply --request request-id --output json
```

This package exposes the first runtime-owned agent loop through thin CLI adapters. Local runs are deterministic by default; live DeepSeek provider behavior is opt-in through `--live` and local credentials.

Chat slash help is projected from shared command composition records. Host controls such as `/exit`, `/clear`, and `/cancel` remain CLI-visible but are not model-visible commands.

Diagnostics commands are local and redacted by default. `diagnostics bundle` creates support-bundle evidence without uploading it, `diagnostics refresh` regenerates allowlisted acceptance evidence under `tests/acceptance/latest/`, `diagnostics evaluate` plans DeepSeek-owned task-completion comparison evidence while keeping Claude Code and Codex baselines opt-in/deferred by default, `diagnostics release` reports package surface, build artifact presence, acceptance evidence file status, ignored generated bundles, and required release verification commands, and `diagnostics verify` summarizes those gates into a read-only pre-publish decision.

External evaluation baselines require explicit opt-in. `--allow-external-baseline --baseline-command <cmd>` only probes the configured CLI and records planned task runs; it does not send task prompts or allow the external tool to mutate the workspace in this slice.

Extension commands are CLI-first management adapters over shared contracts. They render plugin permission diffs, auth requirement diffs, lockfile evidence, auth readiness records, skill summaries, MCP gateway test evidence, and credential scope diagnostics without resolving raw secrets or relying on marketplace/network access by default.

MCP and plugin credential behavior is fail-closed. Declared credential-backed tool/resource/contribution operations must carry matching scoped grants before dispatch or subsystem registration; otherwise CLI text, JSON, and JSONL output render the same redacted evidence records with pit fixture ids and replay fingerprints. Host-specific auth UI for VSCode, server, SDK, marketplace, team, or enterprise adapters is deferred until the CLI evidence path is stable.

Index provider commands manage local provider intent only. PageIndex remains the deterministic truth source; ZVec and code-index requests are normalized through shared diagnostics and remain deferred until implementation evidence exists.
