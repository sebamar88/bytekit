# GitHub Actions Workflows

This directory contains automated workflows for CI/CD, testing, and repository maintenance.

## Workflows

### 🔧 Core CI/CD

#### `ci.yml` - Continuous Integration
- **Triggers:** Push to main/develop, Pull Requests
- **Jobs:**
  - Build and test on Node 18.x, 20.x, 22.x
  - Run linter
  - Generate coverage reports
  - Upload to Codecov
- **Purpose:** Ensure code quality and compatibility

#### `coverage.yml` - Enhanced Coverage Reporting
- **Triggers:** Push to main/develop, Pull Requests
- **Jobs:**
  - Generate detailed coverage reports
  - Comment coverage percentage on PRs
  - Upload coverage artifacts
- **Purpose:** Track and improve test coverage

#### `release.yml` - Automated Releases
- **Triggers:** Push to main when package.json changes
- **Jobs:**
  - Create GitHub releases
  - Publish to npm
  - Generate release notes
- **Purpose:** Automate package publishing
- **Requirements:** Set `NPM_TOKEN` secret

### 🔒 Security

#### `codeql.yml` - Security Analysis
- **Triggers:** Push, PRs, Weekly schedule
- **Jobs:**
  - CodeQL security scanning
  - Vulnerability detection
  - Security alerts
- **Purpose:** Identify security vulnerabilities

#### `dependency-review.yml` - Dependency Security
- **Triggers:** Pull Requests
- **Jobs:**
  - Review dependency changes
  - Check for known vulnerabilities
  - Comment security issues on PRs
- **Purpose:** Prevent vulnerable dependencies

### 📊 Quality Checks

#### `bundle-size.yml` - Bundle Size Tracking
- **Triggers:** Pull Requests
- **Jobs:**
  - Calculate bundle sizes
  - Comment size changes on PRs
  - Track size over time
- **Purpose:** Prevent bundle bloat

#### `stale.yml` - Issue Management
- **Triggers:** Daily schedule
- **Jobs:**
  - Mark inactive issues/PRs as stale
  - Auto-close after inactivity period
- **Purpose:** Keep repository clean

## Setup Requirements

### Secrets

Add these secrets in repository settings:

1. **`NPM_TOKEN`** (for release.yml)
   - Go to npmjs.com → Access Tokens
   - Create automation token
   - Add to GitHub Secrets

2. **`CODECOV_TOKEN`** (optional, for ci.yml)
   - Go to codecov.io
   - Add repository
   - Copy token to GitHub Secrets

### Permissions

Workflows require these permissions:
- `contents: write` - For creating releases
- `pull-requests: write` - For PR comments
- `security-events: write` - For CodeQL
- `issues: write` - For stale management

## Badge Examples

Add these to your README.md:

```markdown
![CI](https://github.com/sebamar88/bytekit/workflows/CI/badge.svg)
![CodeQL](https://github.com/sebamar88/bytekit/workflows/CodeQL%20Security%20Analysis/badge.svg)
[![codecov](https://codecov.io/gh/sebamar88/bytekit/branch/main/graph/badge.svg)](https://codecov.io/gh/sebamar88/bytekit)
```

## Customization

### Adjust Node Versions

Edit the matrix in `ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add/remove versions
```

### Change Coverage Thresholds

Edit `coverage.yml` coverage percentage checks:
```javascript
const emoji = coverageNum >= 80 ? '✅' : coverageNum >= 60 ? '⚠️' : '❌';
```

### Modify Stale Timeframes

Edit `stale.yml`:
```yaml
days-before-issue-stale: 60  # Days before marking stale
days-before-issue-close: 14  # Days before closing
```

## Troubleshooting

### Workflow Not Running

1. Check workflow file syntax
2. Verify trigger conditions match
3. Check repository permissions
4. Review workflow logs in Actions tab

### Coverage Not Uploading

1. Verify `CODECOV_TOKEN` secret is set
2. Check coverage file is generated
3. Review Codecov dashboard

### Release Failing

1. Verify `NPM_TOKEN` is valid
2. Check package.json version is unique
3. Ensure tests pass before release

## Best Practices

1. **Keep workflows focused** - One responsibility per workflow
2. **Use caching** - Speed up builds with dependency caching
3. **Fail fast** - Set `fail-fast: false` for matrix builds
4. **Comment on PRs** - Provide feedback directly in PRs
5. **Monitor costs** - Use `if` conditions to skip unnecessary runs
