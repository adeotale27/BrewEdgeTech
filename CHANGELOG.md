# Changelog — Brew EdgeTech

All notable changes to the Brew EdgeTech website are documented here.
This history is also viewable inside the admin studio under **Version Control** (admin-only).

## [1.2.0] — 2026-10-03
### Fixed
- Resolved the root-cause script error (missing `</script>` + invalid regex) that had frozen the hero progress animation. It now loops 0 → 100% with the Plan → Build → Review → Refine → Complete milestones.
- Removed a disabled legacy block that leaked raw JavaScript as text above the footer.
### Added
- 3D depth / tilt interactions and smoother motion across cards and the hero.
- Nivara Finance demo card now displays its real homepage screenshot.
- Admin **Version Control** section (release history, admin-only).
- "Home screenshot" field in the admin Demo Library editor.
### Changed
- Phone view now leads with the hero (the value band is hidden on small screens).
- Refreshed the brand logo and fixed the "Brew EdgeTech" wordmark spacing.

## [1.1.0] — 2026-10-03
### Fixed
- Leaked script text above the footer.
### Added
- "View Live Demo" buttons on Our Work cards (Nivara Finance → live demo).
### Changed
- Light, professional admin login; sidebar hidden until authenticated.
- Redesigned brand logo (first pass).

## [1.0.0] — 2026-10-03
### Added
- Portable rebuild on **Next.js + MongoDB** (deployable to Vercel/Netlify/AWS/Node), removing the Hatchable/PostgreSQL dependency.
- Secure, environment-based admin authentication (HMAC-signed httpOnly session).
- Admin error-logging system.
- Preserved the original UI plus content CMS, portfolio, media, leads, revisions, scheduling and SEO tools, all on MongoDB.
