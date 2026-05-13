## 1. Reference Preservation

- [x] 1.1 Preserve PageIndex `turn` result targets when chat adds focused recall results to references.
- [x] 1.2 Add deterministic CLI coverage proving workspace recall references remain `kind=turn` after `/palette refs add current`.

## 2. Runtime Projection

- [x] 2.1 Include recall scope in PageIndex summary content, provenance, and dependency fingerprints.
- [x] 2.2 Add deterministic CLI coverage proving cross-session workspace recall references project into the next model request without prompt mutation.

## 3. Validation

- [x] 3.1 Run focused CLI regression tests for PageIndex recall/reference projection.
- [x] 3.2 Validate the OpenSpec change strictly.
