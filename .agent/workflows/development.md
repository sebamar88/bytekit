# Bytekit Development Workflows

> Flujos de trabajo comunes para desarrollo y mantenimiento del proyecto.

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/sebamar88/bytekit.git
cd bytekit

# 2. Install dependencies
pnpm install

# 3. Build the project
pnpm run build

# 4. Run tests
pnpm run test
```

## 📝 Adding a New Module

### 1. Create the Source File

```bash
# Location: src/utils/helpers/{ModuleName}.ts (for helpers)
# Location: src/utils/core/{ModuleName}.ts (for core modules)
```

### 2. File Template

```typescript
// src/utils/helpers/NewModule.ts

/**
 * Brief description of what this module does.
 * @module NewModule
 */

export interface NewModuleOptions {
  // Configuration options
}

export class NewModule {
  constructor(options?: NewModuleOptions) {
    // Implementation
  }

  /**
   * Method description
   * @param param - Parameter description
   * @returns Return value description
   */
  public methodName(param: string): string {
    // Implementation
    return param;
  }
}

// Static utility functions
export const NewModuleUtils = {
  utilityFunction: (input: string): string => {
    return input;
  }
};
```

### 3. Export from Index Files

```typescript
// src/utils/helpers/index.ts
export * from './NewModule.js';

// src/utils/index.ts (if not already re-exporting helpers)
export * from './helpers/index.js';

// src/index.ts
export * from './utils/index.js';
```

### 4. Add Modular Export (package.json)

```json
{
  "exports": {
    "./new-module": {
      "types": "./dist/utils/helpers/NewModule.d.ts",
      "import": "./dist/utils/helpers/NewModule.js"
    }
  }
}
```

### 5. Create Re-export File

```typescript
// src/new-module.ts
export * from './utils/helpers/NewModule.js';
```

### 6. Write Tests

```javascript
// tests/new-module.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NewModule } from '../dist/utils/helpers/NewModule.js';

describe('NewModule', () => {
  describe('methodName', () => {
    it('should return the input string', () => {
      const module = new NewModule();
      assert.strictEqual(module.methodName('test'), 'test');
    });
  });
});
```

## 🧪 Testing Workflow

### Run All Tests

```bash
pnpm run test
```

### Run Single Test File

```bash
node --test tests/specific-module.test.js
```

### Run Tests with Coverage

```bash
pnpm run test:coverage
```

### Test Patterns Used

```javascript
// Node.js built-in test runner
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Property-based testing with fast-check
import fc from 'fast-check';

it('should handle any string', () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      const result = StringUtils.slugify(s);
      return typeof result === 'string';
    })
  );
});
```

## 🔧 Maintenance Workflow

### Code Quality

```bash
# Lint code
pnpm run lint

# Auto-fix lint issues
pnpm run lint:fix

# Format code
pnpm run format
```

### Build

```bash
# Clean and rebuild
pnpm run clean
pnpm run build

# Just rebuild
pnpm run build
```

### Publish

```bash
# Pre-publish checks run automatically
pnpm publish

# Manual pre-publish
pnpm run prepublishOnly
```

## 📚 Documentation Workflow

### Generate Wiki Pages

```bash
pnpm run wiki:generate
```

This script (`scripts/generate-wiki.js`) generates wiki documentation for all modules.

### Update CHANGELOG

Follow Keep a Changelog format in `CHANGELOG.md`:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Changed behavior description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

## 🔄 CI/CD Pipeline

### GitHub Actions Triggers

- **Push**: `main`, `master` branches
- **Pull Request**: `main`, `master` branches

### Pipeline Steps

1. **Checkout**: Clone repository
2. **Install pnpm**: Version 9
3. **Setup Node**: Test matrix (18.x, 20.x, 22.x)
4. **Install**: `pnpm install`
5. **Lint**: `pnpm run lint`
6. **Build**: `pnpm run build`
7. **Test**: `pnpm run test`

### Coverage Job (after build)

1. Run tests with `--experimental-test-coverage`
2. Upload to Codecov

## 🐛 Debugging

### Enable Debug Logging

```typescript
import { enableDebugMode, logDebug } from 'bytekit/debug';

// Enable debug mode
enableDebugMode(true);

// Use debug logging in your code
logDebug('module-name', 'Debug message', { data });
```

### VS Code Debugging

`.vscode/launch.json` should be configured for debugging tests and src files.
