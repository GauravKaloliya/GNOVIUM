import type { ChangelogEntry } from './types';

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v1.0.1',
    date: '2026-06-22',
    type: 'patch',
    title: 'Docs Site Enhancements & Theme Expansion',
    description: 'Major documentation site overhaul with expanded theming system, responsive redesign, enhanced interactivity, and new visual identity. All 106 endpoints fully documented with interactive features.',
    breaking: false,
    changes: [
      { type: 'added', description: '6 themes: dark, light, sepia, high-contrast, ocean (blue), midnight (purple)', module: 'Docs' },
      { type: 'added', description: 'Custom accent color system per theme via CSS variables', module: 'Docs' },
      { type: 'added', description: 'Theme cycling toggle in navigation bar', module: 'Docs' },
      { type: 'added', description: 'Floating sidebar with smooth show/hide animation and reopen button', module: 'Docs' },
      { type: 'added', description: 'Cute animated robot mascot illustration in documentation hero', module: 'Docs' },
      { type: 'added', description: 'Neo-brutalist design system: heavy borders, neo-depth shadows, high-contrast typography', module: 'Docs' },
      { type: 'added', description: 'Desktop and mobile completely separate layout trees', module: 'Docs' },
      { type: 'added', description: 'MobileDocs standalone component with accordion modules and detail panel', module: 'Docs' },
      { type: 'added', description: 'Search palette modal (Ctrl+K) with keyboard navigation', module: 'Docs' },
      { type: 'added', description: 'Filter endpoints by HTTP method, module, sort A-Z, grid/list toggle', module: 'Docs' },
      { type: 'added', description: 'Pin/favorite endpoints persisted to localStorage', module: 'Docs' },
      { type: 'added', description: 'Recently viewed endpoints with "Continue where you left off" banner', module: 'Docs' },
      { type: 'added', description: 'Breadcrumb navigation trail with module and endpoint hierarchy', module: 'Docs' },
      { type: 'added', description: 'Error catalog page with 17 documented error codes', module: 'Docs' },
      { type: 'added', description: 'Collapsible endpoint cards using CSS grid-template-rows', module: 'Docs' },
      { type: 'added', description: 'Color-coded module headers (24 modules) with getModuleColor()', module: 'Docs' },
      { type: 'added', description: 'Toast notifications with ARIA live region screen reader support', module: 'Docs' },
      { type: 'added', description: 'Scroll-triggered RevealSection animations via framer-motion', module: 'Docs' },
      { type: 'added', description: 'Zen mode with full-width content and smooth CSS transitions', module: 'Docs' },
      { type: 'added', description: 'Scroll progress bar and scroll-to-top button on mobile', module: 'Docs' },
      { type: 'added', description: 'Particle graph animated background in hero', module: 'Docs' },
      { type: 'added', description: 'Haptic feedback (navigator.vibrate) on mobile interactions', module: 'Docs' },
      { type: 'added', description: 'Skip-to-content link, focus-visible styles, prefers-reduced-motion support', module: 'Docs' },
      { type: 'changed', description: 'Consistent type scale reduced to 9px/10px/11px/13px for compact readability', module: 'Docs' },
      { type: 'changed', description: 'Search inputs redesigned with bg-transparent, uppercase bold monospace style', module: 'Docs' },
      { type: 'changed', description: 'Footer OPEN SOURCE label replaced with dynamic version display', module: 'Docs' },
      { type: 'fixed', description: 'Filters toggle now correctly hides without blocking page interaction', module: 'Docs' },
      { type: 'fixed', description: 'Sidebar zen mode button properly visible with h-full flex layout', module: 'Docs' },
      { type: 'fixed', description: 'Search input browser default white border/outline removed on focus', module: 'Docs' },
      { type: 'fixed', description: 'All TypeScript errors resolved; build produces zero warnings', module: 'Docs' },
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-Q4',
    type: 'major',
    title: 'Cloud Sync & Multi-Device',
    description: 'Multi-user collaboration, real-time sync, shared workspaces, managed hosting, and automatic backups. The biggest release since v1.0.',
    breaking: true,
    changes: [
      { type: 'added', description: 'Real-time WebSocket sync for collaborative editing', module: 'Sync' },
      { type: 'added', description: 'Workspace member roles and permissions system', module: 'Workspaces' },
      { type: 'added', description: 'Shared workspaces with multi-device access', module: 'Workspaces' },
      { type: 'added', description: 'Automatic scheduled backups', module: 'Backups' },
      { type: 'changed', description: 'API base URL changed from /api/v1 to /api/v2', module: 'General' },
      { type: 'changed', description: 'Rate limits increased for cloud-tier workspaces', module: 'General' },
      { type: 'deprecated', description: 'v1 API endpoints scheduled for removal in v3', module: 'General' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-07',
    type: 'minor',
    title: 'Cloud Mode Beta',
    description: 'Cloud mode with NeonDB, S3 storage, and Redis caching. GNOVIUM_MODE env var configuration for local/cloud switching.',
    breaking: false,
    changes: [
      { type: 'added', description: 'Cloud mode infrastructure (NeonDB + S3 + Redis)', module: 'Workspaces' },
      { type: 'added', description: 'GNOVIUM_MODE environment variable support', module: 'System' },
      { type: 'added', description: 'Presigned URL file upload support', module: 'Files' },
      { type: 'added', description: 'Workspace-level sync operations', module: 'Sync' },
      { type: 'changed', description: 'Local mode uses SQLite with SimpleCache by default', module: 'System' },
      { type: 'fixed', description: 'Embedding generation timeout for large documents', module: 'AI' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-06',
    type: 'major',
    title: 'Initial MVP Release',
    description: 'First stable release of the Gnovium Knowledge OS API. Local-first knowledge management with block editing, relational graphs, versioning, and AI-powered search.',
    breaking: true,
    changes: [
      { type: 'added', description: 'Block-based workspace with rich text editing', module: 'Blocks' },
      { type: 'added', description: 'Entity system with custom types and properties', module: 'Entities' },
      { type: 'added', description: 'Relational knowledge graph with typed edges', module: 'Graph' },
      { type: 'added', description: 'Git-inspired versioning with snapshots and branches', module: 'Versions' },
      { type: 'added', description: 'Visual diff viewer for entity comparison', module: 'Diffs' },
      { type: 'added', description: 'AI workspace assistant with semantic search', module: 'AI' },
      { type: 'added', description: 'Governance dashboard with health scoring', module: 'Governance' },
      { type: 'added', description: 'Full-text and hybrid search across entities', module: 'Search' },
      { type: 'added', description: 'JWT-based authentication with refresh tokens', module: 'Auth' },
      { type: 'added', description: 'Starter API documentation site', module: 'Docs' },
    ],
  },
  {
    version: 'v0.9.0',
    date: '2026-05',
    type: 'beta',
    title: 'Beta Preview',
    description: 'Pre-release beta for early adopters. Core API stabilized, documentation in preview.',
    breaking: false,
    changes: [
      { type: 'added', description: 'Tag system for entity classification', module: 'Tags' },
      { type: 'added', description: 'Comment system with threaded replies', module: 'Comments' },
      { type: 'added', description: 'Activity logging for workspace audit trail', module: 'Activity' },
      { type: 'added', description: 'Background job system for async operations', module: 'Jobs' },
      { type: 'added', description: 'Initial rate limiting framework', module: 'General' },
      { type: 'changed', description: 'API response envelope standardized to { data, meta }', module: 'General' },
    ],
  },
  {
    version: 'v0.5.0',
    date: '2026-04',
    type: 'beta',
    title: 'Developer Preview',
    description: 'Early developer preview with core CRUD operations and basic graph functionality.',
    breaking: false,
    changes: [
      { type: 'added', description: 'Entity CRUD with basic properties', module: 'Entities' },
      { type: 'added', description: 'Block CRUD with position-based ordering', module: 'Blocks' },
      { type: 'added', description: 'Relation system for connecting entities', module: 'Relations' },
      { type: 'added', description: 'Basic graph traversal and pathfinding', module: 'Graph' },
      { type: 'added', description: 'File upload and management', module: 'Files' },
      { type: 'added', description: 'Notification system', module: 'Notifications' },
    ],
  },
];

export const VERSIONING_POLICY = {
  current: 'v1.0.1',
  next: 'v1.1.0',
  deprecationNotice: '6 months',
  supportedVersions: ['v1.0.1', 'v1.0.0'],
  policy: `Gnovium follows semantic versioning (MAJOR.MINOR.PATCH) for both the API and documentation.

- **Major versions** (v1, v2) introduce breaking changes. Each major version is supported for a minimum of 12 months from the release of the next major version.
- **Minor versions** (v1.1, v1.2) add functionality in a backward-compatible manner. Deprecation warnings are added at least one minor version before removal.
- **Patch versions** (v1.0.1) include backward-compatible bug fixes, documentation enhancements, security patches, and UI/UX improvements.

## Version Strategy

| Version | Status      | Release      | End of Life    |
|---------|-------------|--------------|----------------|
| v1.0.1  | Current     | Jun 22, 2026 | Dec 2027       |
| v1.0.0  | Superseded  | Jun 2026     | —              |
| v1.1.0  | Planned     | Jul 2026     | Jun 2028       |
| v2.0.0  | Planned     | Q4 2026      | Jun 2029       |

## Deprecation Flow

1. Feature is marked as \`deprecated\` in changelog with migration guide
2. API response includes \`Warning: deprecated\` header
3. Feature remains functional for 6 months after deprecation notice
4. Feature is removed in the next major version

## API Versioning

Gnovium supports two versioning methods:

**URL-based (recommended):** \`/api/v1/entities/\` — explicit, easy to read, preferred for new integrations.

**Header-based:** \`Accept: application/vnd.gnovium.v1+json\` — cleaner URLs, requires client header management.
`,
};

export const DEPRECATION_TIMELINE = [
  { feature: 'v1 API (URL path /api/v1/)', deprecatedIn: 'v1.1.0', removalIn: 'v3.0.0', migration: 'Use /api/v2/ endpoints. All v1 endpoints have v2 equivalents.' },
  { feature: 'OAuth2 implicit grant', deprecatedIn: 'v1.1.0', removalIn: 'v2.0.0', migration: 'Migrate to OAuth2 authorization code flow with PKCE.' },
  { feature: 'Legacy plain-text content blocks', deprecatedIn: 'v1.0.0', removalIn: 'v2.0.0', migration: 'Use structured JSONB content format.' },
  { feature: 'Search mode "keyword" (default)', deprecatedIn: 'v0.9.0', removalIn: 'v2.0.0', migration: 'Use "hybrid" mode for better results.' },
  { feature: 'v1.0.0 documentation site (classic layout)', deprecatedIn: 'v1.0.1', removalIn: 'v2.0.0', migration: 'Upgrade to neo-brutalist v1.0.1+ docs for enhanced theming, mobile support, and accessibility.' },
];
