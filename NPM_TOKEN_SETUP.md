# Quick Setup: NPM_TOKEN Secret

Follow these steps to enable automated npm publishing:

## 1. Get your npm token (Already done! ✅)

You already have your token: `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`

## 2. Add token to GitHub Secrets

1. Go to: https://github.com/marouanouadi1/istat-geo-sync/settings/secrets/actions

2. Click **"New repository secret"**

3. Fill in:

   - **Name**: `NPM_TOKEN`
   - **Secret**: `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`

4. Click **"Add secret"**

## 3. Test the setup

The automated publishing will trigger when you create a GitHub Release:

```bash
# Bump version
npm version patch

# Push with tags
git push && git push --tags

# Create a release on GitHub
# Go to: https://github.com/marouanouadi1/istat-geo-sync/releases/new
# - Choose the tag (e.g., v0.1.1)
# - Add title and description
# - Click "Publish release"
```

The GitHub Action will automatically publish to npm! 🚀

## Important Notes

⚠️ **Security**: Delete this file after setup (it contains your token!)
⚠️ **Token Expiry**: npm tokens expire after 90 days (as of Oct 2025)
⚠️ **Rotation**: You'll need to update the GitHub secret when the token expires

For detailed instructions, see: [.github/GITHUB_ACTIONS_SETUP.md](.github/GITHUB_ACTIONS_SETUP.md)
