# Future Host Landing Zones

The first framework reserves host-level landing zones without implementing deferred product UX.

| Capability | Landing Zone | First Framework Position |
| --- | --- | --- |
| Voice and push-to-talk | future host input adapter over the protocol | reserved |
| Vim/keybindings/history search | CLI host input package | reserved |
| Rich TUI, banners, tips, notifications | CLI renderer over runtime events | reserved |
| Browser/native host | future app adapter over remote/runtime protocol | reserved |
| Plugin recommendation and onboarding | future recommendation service over plugin/catalog events | reserved |
| Team memory sync and managed settings | future enterprise service over memory/config contracts | reserved |
| Local daemon/server | future transport app over protocol/session contracts | reserved |
| Production sandbox matrix | hardened adapters behind policy/platform contracts | reserved |
| Update UI | host renderer over distribution/evolution events | reserved |

These capabilities must enter through host adapters or platform services. They must not import runtime internals or bypass policy, session, protocol, or audit boundaries.
