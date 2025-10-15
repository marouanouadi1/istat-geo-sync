# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to **ouadimarouan@gmail.com**. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to include in your report

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to expect

- A response to your report within 48 hours
- A plan for fixing the vulnerability
- Regular updates on the progress
- Credit in the security advisory (if desired)

## Security Best Practices

When using this package:

1. **Keep dependencies updated**: Use Dependabot or regularly run `npm audit` and `npm update`
2. **Review database credentials**: Never commit credentials to version control
3. **Use environment variables**: Store sensitive configuration in environment variables or secure secret management systems
4. **Validate inputs**: When using the programmatic API, validate all user inputs
5. **Use HTTPS**: Always use HTTPS for database connections in production
6. **Principle of least privilege**: Database users should have minimal necessary permissions

## Known Security Considerations

### Database Credentials
This package connects to databases and requires credentials. Always:
- Use environment variables or config files with restricted permissions
- Never hardcode credentials
- Use read-only database users when only exporting data
- Implement proper access controls on configuration files

### SQLite Files
When using SQLite:
- Set appropriate file permissions (e.g., `chmod 600`)
- Store database files outside the web root
- Be aware of file path traversal risks when accepting user input for database paths

### XLSX Parsing
The package parses XLSX files from ISTAT. While we use the well-maintained `xlsx` library:
- Be aware of potential parsing vulnerabilities
- Keep the `xlsx` dependency updated
- Consider validating downloaded files against known checksums

## Automated Security

This repository uses:
- **Dependabot**: Automatic dependency updates
- **CodeQL**: Static code analysis for security vulnerabilities
- **npm audit**: Regular vulnerability scanning
- **Dependency Review**: Reviews dependencies in pull requests

## Dependencies Audit

You can check for vulnerabilities in dependencies:

```bash
npm audit
```

To fix vulnerabilities automatically (when possible):

```bash
npm audit fix
```

## Security Updates

Security updates are treated as high priority and will be released as patch versions as soon as possible after a vulnerability is confirmed and fixed.

## Acknowledgments

We thank the security research community for helping keep this project and its users safe.
