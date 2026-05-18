# deepseek-agent-cli

Future-ready DeepSeek coding-agent CLI framework preview.

```bash
npm install -g deepseek-agent-cli
deepseek run "smoke"
deepseek run "smoke" --output jsonl
deepseek chat --output jsonl
deepseek chat --tui full-screen
deepseek chat --session <session-id> --output jsonl
deepseek diagnostics bundle --output json
deepseek diagnostics refresh --dry-run --output json
deepseek diagnostics refresh --output json
deepseek diagnostics evaluate --dry-run --output json
deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command codex --baseline-arg --version --dry-run --output json
deepseek diagnostics release --output jsonl
deepseek diagnostics verify --output json
deepseek mode status --output json
deepseek mode agent --output json
deepseek mode workers --output jsonl
deepseek mode verify --output json
deepseek mode plan --output json
deepseek context status --output json
deepseek context grep "prior decision" --session <session-id> --output jsonl
deepseek extension list --output jsonl
deepseek extension plugin contributions --output jsonl
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

`deepseek chat` now runs as the DeepSeek Workbench in compatible text terminals: transcript, command bar, reasoning rail, inspector, activity feed, plugin shelf, visible prompt, vi-inspired focus keys, shared slash/key action dispatch, declarative contribution diagnostics, and deterministic fallback for scripted or structured output. The default `auto` profile keeps the bounded line workbench; `--tui full-screen` explicitly promotes safe TTY sessions to raw-key/full-screen rendering with alternate-screen lifecycle records and deterministic fallback. Plugin commands/actions/keymaps/palette entries/result lists/render hints are governed descriptors routed through shared contracts, not plugin-private execution.

Visible reasoning is first-class in chat/run output. Text mode renders compact `[reasoning:*]` records with stable ids, JSON adds a `visibleReasoning` projection, JSONL streams schema-versioned `visible.reasoning.recorded` and `visible.reasoning.projected` events, and the TUI state exposes a reasoning rail with compact/full/debug detail levels, evidence counts, active focus, and inspector targets. These are bounded user-visible summaries, not raw provider reasoning or hidden chain-of-thought.

The first-party development plugin pack is bundled as trusted metadata for release: `@deepseek/plugin-dev-checks`, `@deepseek/plugin-repo-navigator`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-context-compactor`. Projection is inert and deterministic; execution, where available, routes through existing command/runtime/platform contracts instead of plugin-private code.

`@deepseek/plugin-context-compactor` is active through `deepseek context ...` and `/context ...`. It uses the lossless context DAG for status, grep, describe, summarize, expand, budget, and pin workflows; summaries keep coverage metadata and can expand back to redacted original nodes. Pinning creates session/palette references and does not write permanent memory automatically.

Fact-sensitive repository, product, command, release, and evaluation tasks run evidence-first by default: the runtime classifies the task, selects bounded local evidence, keeps the user prompt exact, and rejects unsupported strict claims after one revision attempt. One-shot CLI tasks also carry a bounded self-repair loop for repairable failures; repair events and diagnostics record classification, attempts, verification summaries, stop reasons, and redacted replay evidence.

Chat slash help is projected from shared command composition records. Host controls such as `/exit`, `/clear`, and `/cancel` remain CLI-visible but are not model-visible commands.

Mode controls are local product controls, not prompts. `/mode`, `/agent`, `/workers`, `/verify`, `/plan`, and the scriptable `deepseek mode ...` commands render session interaction mode, agent mode, worker lifecycle, verifier verdicts, and phase plans from typed runtime/session events. Unknown or unsupported mode transitions fail locally and preserve the previous mode.

Agent mode orchestration is explicit and replayable. The default path remains single-agent unless orchestration is enabled by runtime policy; evidence, planner, implementer, verifier, coordinator, worker, repair, and synthesis roles are represented as shared contracts with scoped work orders and bounded result records.

Verification is evidence-based. For non-trivial tasks, a successful result needs verifier command evidence or an explicit partial/skip reason; worker self-checks and model confidence are not treated as independent proof. Repair events connect failed verification, safe repair attempts, reruns, and final reconciliation.

Reasoning effort is a model/provider parameter. Evidence loops, verification depth, repair attempts, delegation fan-out, and model iteration caps are product orchestration budgets owned by runtime policy and reported separately in `/model`, diagnostics, and evaluation records.

Diagnostics commands are local and redacted by default. `diagnostics bundle` creates support-bundle evidence without uploading it, `diagnostics refresh` regenerates allowlisted acceptance evidence under `tests/acceptance/latest/`, `diagnostics evaluate` plans DeepSeek-owned task-completion comparison evidence with evidence-grounding and repair metrics while keeping Claude Code and Codex baselines opt-in/deferred by default, `diagnostics release` reports package surface, build artifact presence, acceptance evidence file status, ignored generated bundles, and required release verification commands, and `diagnostics verify` summarizes those gates into a read-only pre-publish decision.

Support bundles keep visible reasoning on the same privacy rail: redacted summaries, evidence counts/fingerprints, projection replay fingerprints, pit fixture ids, and no raw provider/internal reasoning payloads.

External evaluation baselines require explicit opt-in. `--allow-external-baseline --baseline-command <cmd>` only probes the configured CLI and records planned task runs; it does not send task prompts or allow the external tool to mutate the workspace in this slice.

Extension commands are CLI-first management adapters over shared contracts. They render plugin permission diffs, auth requirement diffs, lockfile evidence, auth readiness records, skill summaries, MCP gateway test evidence, and credential scope diagnostics without resolving raw secrets or relying on marketplace/network access by default.

MCP and plugin credential behavior is fail-closed. Declared credential-backed tool/resource/contribution operations must carry matching scoped grants before dispatch or subsystem registration; otherwise CLI text, JSON, and JSONL output render the same redacted evidence records with pit fixture ids and replay fingerprints. Host-specific auth UI for VSCode, server, SDK, marketplace, team, or enterprise adapters is deferred until the CLI evidence path is stable.

Index provider commands manage local provider intent only. PageIndex remains the deterministic truth source; ZVec and code-index requests are normalized through shared diagnostics and remain deferred until implementation evidence exists.
