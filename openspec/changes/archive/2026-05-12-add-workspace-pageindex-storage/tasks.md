## 1. Specification And Planning

- [x] 1.1 Validate the OpenSpec proposal, design, and delta specs for workspace PageIndex recall.

## 2. CLI Implementation

- [x] 2.1 Add a focused workspace PageIndex store module that reads/writes bounded schema-versioned payloads under workspace metadata.
- [x] 2.2 Normalize chat PageIndex pages into workspace-scoped pages with stable provenance and bounded previews.
- [x] 2.3 Persist workspace pages after completed chat prompt turns without breaking session snapshots.
- [x] 2.4 Resolve `/palette recall --scope workspace <query>` through the workspace store and keep global recall deferred.
- [x] 2.5 Emit typed local failures for workspace storage read/resolve failures without falling back to session results.

## 3. Regression Coverage

- [x] 3.1 Add CLI tests for cross-session workspace PageIndex recall.
- [x] 3.2 Add CLI tests for bounded workspace persistence and recall serialization.
- [x] 3.3 Add CLI tests for workspace storage failure and no session fallback.
- [x] 3.4 Assert global recall remains deferred.

## 4. Validation

- [x] 4.1 Run focused CLI tests.
- [x] 4.2 Run OpenSpec change validation, specs validation, typecheck, lint, and boundary checks.
