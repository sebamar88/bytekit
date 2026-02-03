# Contributing to Bytekit

First off, thanks for taking the time to contribute! 🎉

We love your input! We want to make contributing to Bytekit as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [sebamar88@gmail.com](mailto:sebamar88@gmail.com).

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include environment details** (Node.js version, OS, browser)

Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When creating a feature request:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the proposed feature
- **Explain why this feature would be useful** to most users
- **Include code examples** showing how the feature would be used

Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

### Your First Code Contribution

Unsure where to begin? You can start by looking through `good-first-issue` and `help-wanted` issues:

- **Good first issues** - issues which should only require a few lines of code
- **Help wanted issues** - issues which should be a bit more involved

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** following our code style guidelines
4. **Add tests** for your changes
5. **Ensure all tests pass**: `pnpm run test:coverage`
6. **Lint your code**: `pnpm run lint`
7. **Format your code**: `pnpm run format`
8. **Update documentation** if needed
9. **Submit your PR** using our template

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bytekit.git
cd bytekit

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### Development Workflow

```bash
# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# View coverage UI
pnpm run test:ui

# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format

# Type check
pnpm run typecheck

# Build
pnpm run build
```

## 🔄 Pull Request Process

1. **Update the README.md** with details of changes to the interface (if applicable)
2. **Update the CHANGELOG.md** following [Keep a Changelog](https://keepachangelog.com/) format
3. **Ensure all tests pass** and coverage remains above 90%
4. **Update documentation** for any new features or changes
5. **Follow the commit message convention** (see below)
6. **Request review** from maintainers
7. **Address review feedback** promptly
8. **Squash commits** before merging (if requested)

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**

```
feat(api-client): add retry mechanism with exponential backoff

fix(date-utils): handle timezone edge cases correctly

docs(readme): update installation instructions

test(array-utils): add edge case tests for chunk function
```

## 🎨 Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Naming Conventions

- **Files**: kebab-case (`array-utils.ts`)
- **Classes**: PascalCase (`ApiClient`)
- **Functions**: camelCase (`formatDate`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with 'I' prefix optional (`IRequestOptions` or `RequestOptions`)

### Code Organization

```typescript
// 1. Imports (external first, then internal)
// Native fetch is available globally in Node.js 18+ and browsers
import { Logger } from "./logger";

// 2. Types and Interfaces
interface Options {
    timeout: number;
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Main implementation
export class MyClass {
    // ...
}

// 5. Helper functions (unexported)
function helperFunction() {
    // ...
}
```

### Best Practices

- **DRY (Don't Repeat Yourself)**: Extract common logic into utilities
- **SOLID Principles**: Follow single responsibility, open/closed, etc.
- **Error Handling**: Always handle errors gracefully with descriptive messages
- **Documentation**: Add JSDoc comments for all public APIs
- **Performance**: Consider performance implications, especially for utilities
- **Type Safety**: Leverage TypeScript's type system fully

## ✅ Testing Guidelines

### Test Coverage Requirements

- **Overall coverage**: >= 90%
- **Branch coverage**: >= 85%
- **Function coverage**: >= 90%
- **Line coverage**: >= 90%

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./my-function";

describe("myFunction", () => {
    it("should handle normal input", () => {
        expect(myFunction("test")).toBe("expected");
    });

    it("should handle edge cases", () => {
        expect(myFunction("")).toBe("");
        expect(myFunction(null)).toThrow();
    });

    it("should handle errors gracefully", () => {
        expect(() => myFunction(undefined)).toThrow("Invalid input");
    });
});
```

### Test Structure

- **Arrange**: Set up test data and conditions
- **Act**: Execute the function/method being tested
- **Assert**: Verify the results

### What to Test

- ✅ Happy path scenarios
- ✅ Edge cases (empty arrays, null/undefined, boundary values)
- ✅ Error conditions
- ✅ Type safety (if using TypeScript)
- ✅ Performance (for critical utilities)
- ✅ Integration between modules

## 📚 Documentation Guidelines

### JSDoc Comments

Add JSDoc comments for all public APIs:

````typescript
/**
 * Formats a date according to the specified format string.
 *
 * @param date - The date to format
 * @param format - The format string (e.g., 'YYYY-MM-DD')
 * @param options - Additional formatting options
 * @returns The formatted date string
 * @throws {Error} If the date is invalid
 *
 * @example
 * ```typescript
 * formatDate(new Date(), 'YYYY-MM-DD')
 * // => '2024-03-15'
 * ```
 */
export function formatDate(
    date: Date,
    format: string,
    options?: FormatOptions
): string {
    // ...
}
````

### README Updates

When adding new features:

1. Add to the feature list
2. Include usage examples
3. Update the API reference
4. Add to the table of contents if needed

### Wiki Updates

For major features:

1. Create a dedicated wiki page
2. Include detailed examples
3. Add troubleshooting section
4. Link from main documentation

## 🌐 Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/sebamar88/bytekit/discussions) - Ask questions and share ideas
- 🐛 [GitHub Issues](https://github.com/sebamar88/bytekit/issues) - Report bugs and request features
- 📧 Email: sebamar88@gmail.com

### Recognition

Contributors will be:

- Listed in our README
- Mentioned in release notes
- Credited in the CHANGELOG

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make Bytekit better for everyone. Thank you for being part of our community!
