# PersonaHub - Review Fixes

**Source:** UltraThink Review (2026-02-16)
**Status:** Applied to Stories

---

## Critical Fixes (Must Have)

### 1. ✅ Path Traversal Security
**Issue:** `path.join()` resolves `../` which could escape snapshot directory
**Fix:** Validate resolved path starts with expected directory
**Applied to:** Stories 1.5, 2.1, 2.4

```typescript
const destPath = path.resolve(baseDir, file.relativePath);
if (!destPath.startsWith(path.resolve(baseDir) + path.sep)) {
  throw new Error('Invalid file path (path traversal attempt)');
}
```

### 2. ✅ Chalk v5 → v4.1.2
**Issue:** Chalk v5 is ESM-only, incompatible with CommonJS TypeScript config
**Fix:** Use chalk@4.1.2
**Applied to:** Story 1.1, package.json

### 3. ✅ Atomic Restore Operation
**Issue:** If restore interrupted mid-operation, workspace is corrupted
**Fix:** 
1. Restore to staging directory first
2. Verify all files copied
3. Move from staging to workspace
4. Cleanup staging
**Applied to:** Story 2.4

### 4. ✅ Input Validation
**Issue:** `parseInt('abc')` returns NaN, causes undefined behavior
**Fix:** Validate all numeric inputs
**Applied to:** Stories 2.3, 2.4

```typescript
if (isNaN(snapshotId) || snapshotId < 1) {
  throw new Error('Invalid snapshot ID');
}
```

### 5. ✅ Hash Length 12 → 16 chars
**Issue:** 12 chars (48 bits) has theoretical collision risk
**Fix:** Use 16 chars (64 bits)
**Applied to:** Stories 1.4, 1.5, 2.1

---

## Should Fix for MVP

### 6. ⬜ Concurrent Access Locking
**Issue:** Cron + user running simultaneously causes race conditions
**Fix:** Use lockfile (`.personahub/lock`)
**Status:** To be added

### 7. ⬜ Binary File Handling  
**Issue:** Diff doesn't work for binary files
**Fix:** Detect binary, show "Binary file differs"
**Status:** To be added

### 8. ⬜ Timezone Handling
**Issue:** `toISOString()` shows UTC, confuses users
**Fix:** Use Intl.DateTimeFormat for local time display
**Status:** To be added

---

## Nice to Have

### 9. ⬜ `--dry-run` flags
**Status:** Deferred to v0.2

### 10. ⬜ Content-Addressable Storage
**Status:** Deferred - full copies for MVP

### 11. ⬜ Integrity Verification
**Status:** Add hash verification on restore

### 12. ⬜ `personahub doctor` command
**Status:** Deferred to v0.2

---

## Dependencies Added

```json
{
  "chalk": "^4.1.2",   // Changed from ^5.3.0
  "diff": "^5.2.0"     // Added for line-level diff
}
```
