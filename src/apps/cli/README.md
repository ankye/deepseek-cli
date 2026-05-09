# deekseek-cli

Future-ready DeepSeek coding-agent CLI framework preview.

```bash
npm install -g deekseek-cli
deepseek run "smoke"
deepseek run "smoke" --output jsonl
deepseek chat --output jsonl
```

This package exposes the first runtime-owned agent loop through thin CLI adapters. Local runs are deterministic by default; live DeepSeek provider behavior is opt-in through `--live` and local credentials.
