# OpenThreads Trace - Developer Guide for Claude Code

## Project Overview

OpenThreads Trace is a cross-browser extension that scans consumer product pages for compliance-surface completeness signals. It detects missing disclosure fields, flags risky marketing claims, and exports structured compliance data in Threadmark-compatible JSON format.

**Target Users**: DTC merchants, compliance consultants
**Platform**: Cross-platform browser extension (Chrome MV3, future Firefox/Safari)
**Architecture**: TypeScript + Vite, data-driven rule engine, client-side only

## Core Architecture

### Technology Stack
- **Build**: Vite 6 + TypeScript 5.7
- **Testing**: Vitest + jsdom (59 passing tests, 50% coverage floor)
- **Linting**: ESLint 9 (flat config) + Prettier
- **CI/CD**: GitHub Actions with CodeQL security scanning
- **Extension**: Chrome Manifest V3 (popup + content script + background service worker)

### Project Structure
```
src/
├── background/        # Background service worker
├── content/           # Content scripts (snapshot capture)
│   ├── snapshot.ts    # DOM extraction: metadata, text, SKU hints
│   └── index.ts       # Message handler for SCAN requests
├── popup/             # Extension popup UI
│   ├── popup.html     # 360x480px UI with category selector + scan button
│   ├── popup.ts       # DOM event wiring, chrome.tabs messaging
│   └── popup-ui.ts    # Pure testable UI functions
├── rules/             # Data-driven compliance rule engine
│   ├── engine.ts      # detectField(), detectClaims(), runRules()
│   ├── field-groups.ts # 12 compliance field definitions (4 groups)
│   └── claim-keywords.ts # Risk claim keywords (eco, sustainable, etc.)
└── types/             # TypeScript types
    ├── scan.ts        # ScanResult, FieldResult, ClaimFlag, PageSnapshot
    └── index.ts       # Exports and ProductCategory enum
```

## Coding Conventions

### TypeScript Patterns
- **Pure functions first**: Separate testable logic from DOM/chrome API calls
  - Example: `popup-ui.ts` has pure functions, `popup.ts` wires DOM
- **Strong typing**: All interfaces in `types/`, no `any`
- **Data-driven rules**: JSON-like structures in `field-groups.ts` and `claim-keywords.ts`
- **Confidence scoring**: Return `0.0-1.0` confidence with detection results
  - Meta tags: 0.9 confidence
  - Text patterns: 0.7 confidence

### File Organization
- **Test files**: Co-located `*.test.ts` next to source
- **One concern per file**: `snapshot.ts` only handles DOM capture, `engine.ts` only handles rule evaluation
- **Exports**: Use named exports, centralize in `index.ts` where appropriate

### Naming Conventions
- **Functions**: `camelCase`, verb-first (`extractMetaTags`, `detectClaims`)
- **Types**: `PascalCase` (`PageSnapshot`, `FieldResult`)
- **Constants**: `SCREAMING_SNAKE_CASE` for data maps (`FIELD_SEARCH_PATTERNS`, `META_KEY_MAP`)
- **Files**: `kebab-case.ts` (exception: `popup-ui.ts` for clarity)

## Feature Development Workflow

### Current Status (per PRD.json)
- ✅ F005: Engineering baseline (hooks, CI, CodeQL)
- ✅ F010: Extension shell UI
- ✅ F020: DOM snapshot capture
- ✅ F030: Rule engine v1
- 🔨 F040: Risk score model (NEXT)
- 📋 F050: Evidence clipper
- 📋 F060: Threadmark JSON export

### Adding New Features
1. **Read PRD.json first**: Check acceptance criteria for the feature ID
2. **Write tests first**: Add `*.test.ts` with expected behavior
3. **Keep pure functions testable**: Separate DOM/chrome APIs from logic
4. **Update progress.txt**: Document what was implemented and test count
5. **Run full checks**: `npm run typecheck && npm test && npm run build`

### Adding New Compliance Fields
1. Add field definition to `field-groups.ts` (specify group, key, required flag)
2. Add detection pattern to `FIELD_SEARCH_PATTERNS` in `engine.ts`
3. Add meta tag mapping to `META_KEY_MAP` if applicable
4. Write unit tests in `rules/engine.test.ts`

### Adding New Claim Keywords
1. Add category to `claim-keywords.ts` (use lowercase for case-insensitive matching)
2. Engine will auto-detect via `detectClaims()` with context extraction
3. Write tests in `rules/claim-keywords.test.ts`

## Testing Philosophy

### Unit Test Requirements
- **Coverage**: Maintain ≥50% threshold (configured in vitest.config.ts)
- **Isolation**: Mock chrome APIs, use jsdom for DOM tests
- **Fast**: Pre-push hook runs tests in <60s
- **Descriptive**: Use `describe()` blocks per function/module

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';

describe('moduleName', () => {
  describe('functionName', () => {
    it('should handle expected case', () => {
      // Arrange
      const input = {...};
      // Act
      const result = functionName(input);
      // Assert
      expect(result).toEqual({...});
    });
  });
});
```

## Git & CI Workflow

### Pre-commit Hook (auto-installed)
- Runs format + lint + typecheck in <15s
- Located in `.husky/pre-commit`

### Pre-push Hook
- Runs full unit test suite in <60s

### CI Checks (GitHub Actions)
- **Required**: lint, typecheck, test, build, package artifact
- **Security**: CodeQL scan on PR + weekly scheduled
- **Coverage**: Uploaded to coverage service (configured threshold)

### Commit Messages
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`
- Example: `feat: add risk score calculation with weighted field penalties`
- Always include co-author: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

## Security & Privacy Constraints

### Hard Requirements (per PRD)
- **No automatic data exfiltration**: User-initiated scans only
- **Sanitized DOM parsing**: Strip scripts/styles in `extractTextContent()`
- **No authentication**: Do not prompt for credentials or access private portals
- **Disclaimer required**: Extension provides signals, not legal advice

### Chrome API Usage
- **activeTab**: Only access current tab on user click
- **scripting**: Inject content scripts declaratively via manifest
- **No network**: All processing is local, no external API calls in v1

## Known Patterns & Anti-Patterns

### ✅ DO
- Extract pure functions for testability (`popup-ui.ts` pattern)
- Use confidence scores with detection results
- Return structured data with context (e.g., `ClaimFlag` includes surrounding text)
- Co-locate tests with source files
- Document acceptance criteria in `progress.txt`

### ❌ DON'T
- Mix DOM manipulation with business logic
- Use `any` type (all types in `types/`)
- Make network calls or external API requests
- Promise legal compliance guarantees in UI text
- Bypass hooks with `--no-verify`

## Next Steps (F040: Risk Score Model)

When implementing the risk score:
1. Create `scoring.ts` with `calculateRiskScore(scanResult: ScanResult): RiskScoreBreakdown`
2. Weight by field importance (required fields > optional)
3. Penalize risky claims without evidence
4. Return explainable breakdown (which fields/claims contribute)
5. Add unit tests for edge cases (all fields present, all missing, mixed)
6. Update `ScanResult` type to include `riskScore` and `riskBreakdown`

## Questions & Support

- **PRD Reference**: `/PRD.json` (source of truth for features)
- **Progress Tracking**: `/progress.txt` (current implementation status)
- **CI Configuration**: `.github/workflows/` (build, test, release)
- **Rule Definitions**: `src/rules/field-groups.ts` and `claim-keywords.ts`

This is a long-running agent-friendly codebase following Anthropic recommendations for structured, testable, data-driven extension development.
