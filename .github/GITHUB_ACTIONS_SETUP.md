# GitHub Actions Setup Guide

This document explains how to configure GitHub Actions for automated publishing to npm.

## Prerequisites

1. **npm Account**: You need an npm account with publishing permissions
2. **GitHub Repository**: Your code must be in a GitHub repository
3. **npm Access Token**: Required for automated publishing

## Step 1: Create npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click on your profile icon → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select token type:
   - **Automation**: For CI/CD pipelines (recommended)
   - Set appropriate permissions (publish access)
5. Copy the token (it starts with `npm_`)

**Important**: Save the token securely - you won't be able to see it again!

## Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your npm token (e.g., `npm_xxx...`)
5. Click **Add secret**

## Step 3: Verify GitHub Actions Setup

The repository includes these workflows:

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

Runs on every push and pull request:

- Runs tests on multiple Node.js versions
- Performs type checking
- Runs linter
- Builds the project

### 2. **Publish Workflow** (`.github/workflows/publish.yml`)

Triggers when you create a GitHub Release:

- Installs dependencies
- Runs tests and type checking
- Builds the project
- Publishes to npm with provenance

### 3. **CodeQL Workflow** (`.github/workflows/codeql.yml`)

Security analysis:

- Runs weekly and on every push/PR
- Scans for security vulnerabilities

### 4. **Dependency Review** (`.github/workflows/dependency-review.yml`)

Reviews dependencies in PRs:

- Checks for known vulnerabilities
- Alerts on moderate+ severity issues

## Step 4: Publishing a New Version

### Manual Process

1. **Update version** in `package.json`:

   ```bash
   npm version patch  # for bug fixes (0.1.0 → 0.1.1)
   npm version minor  # for new features (0.1.0 → 0.2.0)
   npm version major  # for breaking changes (0.1.0 → 1.0.0)
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit and push** the version bump:

   ```bash
   git push && git push --tags
   ```

4. **Create a GitHub Release**:

   - Go to your GitHub repository
   - Click **Releases** → **Draft a new release**
   - Select the tag (e.g., `v0.1.1`)
   - Add release title and description
   - Click **Publish release**

5. **GitHub Actions will automatically**:
   - Run all tests
   - Build the project
   - Publish to npm

### Automated Process with GitHub CLI

```bash
# Install GitHub CLI if you haven't already
# https://cli.github.com/

# Bump version
npm version patch -m "chore: bump version to %s"

# Push changes and tags
git push && git push --tags

# Create GitHub release (triggers npm publish)
gh release create v0.1.1 \
  --title "v0.1.1" \
  --notes "Bug fixes and improvements" \
  --latest
```

## Step 5: Verify Publication

After the GitHub Action completes:

1. **Check GitHub Actions**:

   - Go to **Actions** tab in your repository
   - Verify the "Publish Package to npmjs" workflow succeeded

2. **Check npm**:

   ```bash
   npm view istat-geo-sync version
   ```

3. **Test installation**:
   ```bash
   npm install -g istat-geo-sync@latest
   istat-geo-sync --version
   ```

## Dependabot Configuration

The repository includes Dependabot (`.github/dependabot.yml`) for automatic dependency updates:

- **npm dependencies**: Checked weekly, grouped by patch updates
- **GitHub Actions**: Kept up to date automatically
- PRs are automatically created with labels and assignments

## Troubleshooting

### "npm ERR! need auth" or "npm ERR! code E401"

- Verify `NPM_TOKEN` secret is correctly set in GitHub
- Ensure the token has publish permissions
- Check if the token has expired (tokens have a 90-day limit as of Oct 2025)

### "npm ERR! 403 Forbidden"

- Verify you have publish permissions for the package
- For scoped packages, ensure `publishConfig.access` is set to `"public"` in `package.json`

### Workflow doesn't trigger

- Ensure you're creating a **Release**, not just a tag
- Check if the workflow file syntax is correct
- Look at the Actions tab for error messages

### Provenance fails

- Ensure the repository has proper permissions
- Verify `id-token: write` permission is set in the workflow

## Security Best Practices

1. **Never commit tokens** to the repository
2. **Use Automation tokens** for CI/CD (not personal tokens)
3. **Rotate tokens regularly** (every 90 days)
4. **Enable 2FA** on your npm account
5. **Review Dependabot PRs** before merging
6. **Monitor security alerts** in GitHub

## Additional Resources

- [npm Tokens](https://docs.npmjs.com/about-access-tokens)
- [GitHub Actions for npm](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Semantic Versioning](https://semver.org/)
