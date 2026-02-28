# OpenThreads Trace

**Compliance Exposure Scanner Browser Extension**

A cross-browser extension that scans consumer product pages (Shopify, WooCommerce, Amazon, Etsy, DTC sites) for compliance-surface completeness signals. Flags missing disclosure fields, detects risky marketing claims, and exports structured compliance data.

[![CI](https://github.com/openthreads/surface/actions/workflows/ci.yml/badge.svg)](https://github.com/openthreads/surface/actions/workflows/ci.yml)
[![CodeQL](https://github.com/openthreads/surface/actions/workflows/codeql.yml/badge.svg)](https://github.com/openthreads/surface/actions/workflows/codeql.yml)

## Features

- **One-click page scan** – Extract product metadata, text content, and SKU hints
- **Rule-based compliance detection** – 12 disclosure fields across 4 categories (Identity, Composition, Safety, Claims)
- **Claim risk flagging** – Detects eco/sustainability/health claims requiring evidence
- **Product category selector** – Textiles, Children's Products, Cosmetics, Electronics, General
- **Explainable results** – Confidence scores and detection context
- **Privacy-first** – All processing is local, no data leaves your browser
- **Threadmark export** *(coming soon)* – Structured JSON bundle for compliance workflows

## Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/openthreads/surface.git
cd surface

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` directory
```

### For Users

*(Coming soon: Chrome Web Store, Firefox Add-ons, Edge Add-ons)*

## Usage

1. **Navigate** to any product page (e.g., Shopify store, Amazon listing)
2. **Click** the OpenThreads Trace extension icon
3. **Select** your product category (Textiles, Children's Products, etc.)
4. **Click "Scan Page"**
5. **Review** missing fields and flagged claims
6. **Export** results *(coming soon)*

## Development

### Prerequisites

- Node.js 18+ (20 LTS recommended)
- npm 9+

### Scripts

```bash
# Development
npm run build          # Build extension for production
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format with Prettier
npm run format:check   # Check formatting

# Testing
npm test               # Run unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
```

### Pre-commit & Pre-push Hooks

Hooks are auto-installed on `npm install` via Husky:

- **Pre-commit**: Format, lint, typecheck (<15s)
- **Pre-push**: Full test suite (<60s)

To skip hooks temporarily (not recommended):
```bash
git commit --no-verify
```

### Project Structure

```
src/
├── background/        # Background service worker
├── content/           # Content scripts (DOM snapshot capture)
├── popup/             # Extension popup UI
├── rules/             # Compliance rule engine (field groups, claim keywords)
└── types/             # TypeScript type definitions
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and coding conventions.

## Feature Roadmap

Current status (v1.0.0):

- ✅ **F005**: Engineering baseline (CI, hooks, CodeQL security scanning)
- ✅ **F010**: Extension shell UI
- ✅ **F020**: DOM snapshot capture
- ✅ **F030**: Rule engine v1
- 🔨 **F040**: Risk score model *(in progress)*
- 📋 **F050**: Evidence clipper
- 📋 **F060**: Threadmark JSON export

See [PRD.json](./PRD.json) for full product requirements.

## Compliance Fields Detected

### Identity & Contacts
- Product name ✅ (required)
- Brand ✅ (required)
- Manufacturer name/address
- Contact email or URL

### Composition & Origin
- Materials (fiber content, ingredients)
- Country of origin

### Safety & Use
- Warnings
- Instructions
- Care instructions

### Claims & Evidence
- Marketing claims (eco, sustainable, biodegradable, etc.)
- Certifications (GOTS, OEKO-TEX, etc.)

## Security & Privacy

- **No data collection**: All processing happens locally in your browser
- **No network calls**: Extension does not send data to external servers
- **User-initiated only**: Scans require explicit user action
- **Sanitized parsing**: Scripts and styles are stripped from analyzed content
- **CodeQL scanning**: Continuous security analysis via GitHub Actions

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Follow existing code conventions (see [CLAUDE.md](./CLAUDE.md))
4. Write tests for new features
5. Ensure all checks pass (`npm run typecheck && npm test && npm run build`)
6. Submit a pull request

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Tooling, dependencies
- `docs:` Documentation only

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details.

## Disclaimer

**This extension provides heuristic completeness signals only.**
It does not constitute legal advice or guarantee regulatory compliance.
Users remain responsible for all compliance decisions and verification.

## Acknowledgments

Built with:
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)

Developed by [OpenThreads.dev](https://openthreads.dev) to accelerate structured compliance workflows.

---

**Questions or feedback?** Open an issue or visit [OpenThreads Documentation](https://docs.openthreads.dev).
