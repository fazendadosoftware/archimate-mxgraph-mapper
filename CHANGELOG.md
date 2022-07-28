# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2022-07-28
### Added
- ArchiMate shapes: Archimate_Stakeholder, Archimate_Goal, ArchiMate_WorkPackage, ArchiMate_Plateau, ArchiMate_Requirement, ArchiMate_Gap

## [0.8.0] - 2022-03-28
### Changed
- Improvement: improved routing for relations, taking into account now intermediary waypoints and
docking points at source and target nodes

## [0.7.0] - 2022-03-13
### Added
- Feature: diagrams are now upserted (updated or inserted) into the workspace. A "sparxId" attribute
  is stored in the "state" parameter of the bookmark for allowing the identification of existing Sparxs
  diagrams in the workspace.

## [0.6.1] - 2022-03-12

### Changed
- Bugfix: exported FreeDraw xml includes now waypoints for manually routed relations

## [0.6.0] - 2022-03-09
### Added
- Relation styles are now dynamically generated, taking into account direction, relation type, docking points for
  source and target nodes and original sparx paths.
### Changed
- Bugfix: graph relations were not being shown due to id mismatch.

## [0.5.0] - 2022-02-21

### Changed
- Element id mapping algorithm updated. Original underscore characters ("_") are replaced by dash characters ("-").
