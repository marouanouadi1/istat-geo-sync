# Publishing Guide

This document provides instructions for publishing the `istat-geo-sync` package to npm.

## Pre-publication Checklist

Before publishing, ensure you have completed the following:

- [ ] All tests pass: `npm test`
- [ ] The project builds successfully: `npm run build`
- [ ] Version number is updated in `package.json`
- [ ] `CHANGELOG.md` is updated with the new version changes
- [ ] All changes are committed to git
- [ ] You are logged in to npm: `npm whoami`

## Publishing Steps

### 1. Login to npm (if not already logged in)

```bash
npm login
```

Enter your npm credentials when prompted.

### 2. Run a dry-run to see what will be published

```bash
npm publish --dry-run
```

This will show you:

- The files that will be included in the package
- The package size
- Any warnings or errors

### 3. Publish to npm

```bash
npm publish
```

For the first release (0.1.0), this will publish the package as public.

### 4. Verify the publication

After publishing, verify the package on npm:

- Visit: https://www.npmjs.com/package/istat-geo-sync
- Test installation: `npm install -g istat-geo-sync`
- Test the CLI: `istat-geo-sync --version`

## Version Management

This project follows [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.x): Bug fixes, minor changes

  ```bash
  npm version patch
  ```

- **Minor** (0.x.0): New features, backwards-compatible

  ```bash
  npm version minor
  ```

- **Major** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

The `npm version` command will:

1. Update the version in `package.json`
2. Create a git commit
3. Create a git tag

After running `npm version`, push the changes and tag:

```bash
git push && git push --tags
```

## Troubleshooting

### Package name already exists

If you get an error about the package name already being taken, you'll need to:

1. Choose a different package name
2. Update the `name` field in `package.json`
3. Try publishing again

### Permission denied

Make sure you:

1. Are logged in: `npm whoami`
2. Have permissions to publish under the `istat-geo-sync` scope (if scoped)

### Files missing from package

Check:

1. The `files` field in `package.json`
2. The `.npmignore` file
3. Run `npm publish --dry-run` to preview

## Post-publication

After a successful publication:

1. Create a GitHub release with the same version tag
2. Update the README if needed
3. Announce the release (if applicable)
4. Monitor for issues or feedback

## Unpublishing (Emergency Only)

You can only unpublish within 72 hours of publication:

```bash
npm unpublish istat-geo-sync@0.1.0
```

**Warning**: Unpublishing is discouraged and should only be used in emergencies (e.g., accidental publication of sensitive data).
