# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-10-18

### Added

- Comprehensive development guide with architecture documentation, testing patterns, and code conventions

### Changed

- Enhanced README with improved clarity and structure for usage instructions
- Updated GitHub Actions workflows for better consistency
- Cleaned up workflow files by removing unnecessary configurations

### Dependencies

- Bumped `actions/setup-node` from 4 to 6
- Bumped `actions/checkout` from 4 to 5
- Updated `@types/xlsx` to latest patch version

### Removed

- Removed CodeQL and Dependency Review workflows
- Removed outdated GitHub Actions setup guide
- Removed NPM_TOKEN setup guide

## [0.1.0] - 2025-10-15

### Added

- Initial release
- CLI tool for syncing ISTAT geographic datasets
- Support for exporting to CSV and JSON formats
- Database sync support (MySQL, PostgreSQL, SQLite)
- Export regions, provinces, municipalities, legend, and notes
- Docker Compose configuration for easy setup
- Comprehensive documentation and examples
