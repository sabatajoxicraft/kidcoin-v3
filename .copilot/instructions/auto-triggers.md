# AUTO-TRIGGERS (MANDATORY)

> MDDF v2.0 | Invoke skills automatically. Circuit breakers prevent tail spins.

---

## Auto-Trigger Table

| IF | THEN | Priority |
|----|------|----------|
| Build/test fails | `skill(build-failure-triage)` | P0 |
| 2nd identical error | **CIRCUIT BREAKER** → Research → User | P0 |
| Scaffold task | Include CLI rule in prompt (see scaffolding-rules.md) | P0 |
| Import/path error | Search ALL files for pattern, fix in batch | P0 |
| New dependency | `skill(pre-migration-compatibility-check)` | P1 |
| Code exploration | Launch CodeScouts × max parallel (scale to complexity) | P1 |
| Code change | `skill(implement-with-validation)` | P1 |
| Code writing/editing | Load `coding-standards.md` into Architect prompt | P0 |
| Migration revert | Follow revert checklist in scaffolding-rules.md | P1 |

---

## BATCH FIX RULE (Critical)

Before delegating ANY import/path fix:
1. `grep -r "broken/pattern" src/` to find ALL occurrences
2. Fix ALL in ONE commit - never one-at-a-time
3. Verify with `npx react-native bundle --dry-run` locally
4. THEN push

**Why:** KidCoin had 6 CI failures fixing imports one-at-a-time. Batch fixing = 1 CI run.

---

## Circuit Breaker Protocol

| Attempt | Action |
|---------|--------|
| 1 | Try fix with assigned model |
| 2 (same error) | **STOP** → Invoke skill → Research |
| 3 (different errors) | **STOP** → Root cause analysis |
| 4 | **ESCALATE** to human (Touchpoint #3) |

---

## Skill Usage Examples

### Build Failure
```
IF: Metro bundler fails with "Unable to resolve module"
THEN: skill(build-failure-triage)
- Classify error type
- Research if 2nd failure
- Present findings with evidence
- Wait for user approval
```

### New Dependency  
```
IF: Adding a new package to package.json
THEN: skill(pre-migration-compatibility-check)
- Verify platform compatibility
- Check version conflicts
- Validate before install
```

### Import Error Pattern
```
IF: CI fails with multiple "Cannot find module 'X'" errors
THEN:
1. grep -r "import.*X" src/ → Find ALL 50 occurrences
2. Delegate to Architect: "Fix all 50 imports in ONE batch"
3. BuildBot: npm run bundle --dry-run
4. If pass → git push
```

---

**MDDF v2.0** | Updated 2026-02-07
