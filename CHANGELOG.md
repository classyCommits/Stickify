# Changelog

All notable changes to Stickify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-03-22

### Fixed
- Delete button now correctly responds to clicks on its SVG child icon
- Sanitization applied at render time — closes stored XSS vector
- `javascript:` protocol URLs blocked in link modal
- `manifest.json`: added missing `storage` permission

### Changed
- Fluid layout for side panel (responsive width and height)
- Formatting toolbar hides when no notes exist

### Refactored
- Extracted `getFilteredNotes()` helper, removed duplicated filter logic

---

## [1.1.1] - 2025-06-01

### Added
- Rich text formatting toolbar: H1, H2, Bold, Italic, Underline, and Link insertion
- Link modal with URL validation — only `http://` and `https://` protocols permitted
- Toolbar button active-state highlighting based on current selection context
- Tagging system with comma-separated tags, searchable alongside note content
- Sort notes by Date Created or Date Modified
- Data migration for notes created in v1.0.0 (auto-backfills `dateCreated`, `dateModified`, `tags`)
- `DOMPurify` integration for XSS sanitization on both save and render

### Changed
- Notes container is now fluid — fills the full side panel height instead of a fixed pixel value
- Body width is responsive (`100%`) instead of hardcoded `430px`
- Formatting toolbar hides itself when no notes exist

### Fixed
- Delete button now correctly responds to clicks on its SVG child icon
- Sanitization now applied at render time, not just on edit — closes stored XSS vector
- `javascript:` protocol URLs are now explicitly blocked in the link modal
- `manifest.json`: added missing `storage` permission
- `manifest.json`: version normalised to semver format (`1.1.1`)

---

## [1.0.0] - 2025-05-01

### Added
- Initial release
- Create, edit, and delete sticky notes stored in `localStorage`
- Four note color themes: yellow, pink, blue, green
- Instant search filtering by content
- Chrome Side Panel API integration
- Manifest V3 with strict Content Security Policy