import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const hooksDir = resolve(__dirname, "..", ".git", "hooks");

if (!existsSync(hooksDir)) {
  mkdirSync(hooksDir, { recursive: true });
}

const preCommit = `#!/bin/sh
# Pre-commit hook: format + lint + typecheck (fast path)
echo "Running pre-commit checks..."

npm run format:check || { echo "Formatting issues found. Run 'npm run format' to fix."; exit 1; }
npm run lint || { echo "Linting errors found."; exit 1; }
npm run typecheck || { echo "Type errors found."; exit 1; }

echo "Pre-commit checks passed."
`;

const prePush = `#!/bin/sh
# Pre-push hook: unit tests (fast path)
echo "Running pre-push checks..."

npm run test || { echo "Tests failed. Push aborted."; exit 1; }

echo "Pre-push checks passed."
`;

writeFileSync(resolve(hooksDir, "pre-commit"), preCommit);
chmodSync(resolve(hooksDir, "pre-commit"), 0o755);

writeFileSync(resolve(hooksDir, "pre-push"), prePush);
chmodSync(resolve(hooksDir, "pre-push"), 0o755);

console.log("Git hooks installed successfully.");
