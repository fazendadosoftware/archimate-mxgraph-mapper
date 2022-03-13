# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.1] - 2022-03-12
### Added

### Changed
- Bugfix: exported FreeDraw xml includes now waypoints for manually routed relations

### Removed

## [0.6.0] - 2022-03-09
### Added
- Relation styles are now dynamically generated, taking into account direction, relation type, docking points for
  source and target nodes and original sparx paths.
### Changed
- Bugfix: graph relations were not being shown due to id mismatch.

### Removed

## [0.5.0] - 2022-02-21
### Added

### Changed
- Element id mapping algorithm updated. Original underscore characters ("_") are replaced by dash characters ("-").

### Removed