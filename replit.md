# AI Sentinel - Enterprise AI Governance Platform

## Overview
AI Sentinel is a comprehensive enterprise AI governance platform designed to provide secure, compliant, and monitored AI interactions for organizations. It aims to prevent unauthorized changes to tested code sections, offers real-time chat capabilities, content filtering, and administrative oversight. The vision is to establish a robust solution for managing AI usage within enterprises, ensuring data protection and regulatory compliance.

## User Preferences
Preferred communication style: Simple, everyday language.
Role-based access control: Hierarchical security levels with equal-or-above access model
  - Super-User (100): Full system access, company management
  - Owner (99): Company configuration, API keys, AI models, model fusion
  - Administrator (98): Security settings, user management, activity management, monitoring
  - User (1): Chat interface access only
  - Demo (0): Limited demo access with orange "DEMO" badge
Security model: Level X grants access to all features requiring level X or below
UI Standards: Complete standard CSS implementation - NO Tailwind CSS allowed anywhere (CRITICAL: Pure CSS with inline styles only)
Component styling: All UI components use inline styles for cross-environment consistency
Demo mode identification: Demo mode uses role level 0, shows orange "DEMO" badge, and displays "Using AI Sentinel API Keys" message.

## Recent Changes
**August 8, 2025**: Render deployment configuration fixed and deployed
- **Explicit Build Commands**: Updated render.yaml with direct build/start commands to bypass npm script caching issues (commit 489ed44)
- **Build Process**: `cp package-render.json package.json && npm install && vite build --config vite.config.production.ts && esbuild server/production.ts`
- **Start Command**: Direct execution of `NODE_ENV=production node dist/production.js`
- **Merge Conflicts Resolved**: Fixed conflicts in render.yaml and package-render.json during main branch integration
- **Production Server**: Created dedicated server/production.ts without development dependencies for clean Render deployment
- **GitHub Integration**: All deployment fixes pushed to main branch with automatic Render redeployment

**August 7, 2025**: Render migration files successfully uploaded to GitHub
- **Database Migration**: Successfully migrated complete AI Sentinel database from Railway PostgreSQL to Render PostgreSQL
- **Migration Verification**: All 29 tables, 6 companies, 9 AI models, 9 users, and relationships preserved
- **Deployment Configuration**: Created render.yaml and package-render.json for Render deployment
- **Health Monitoring**: Added /health endpoint for Render service monitoring
- **Cost Optimization**: Migration reduces hosting costs from $25/month to $14/month ($132/year savings)
- **Performance Enhancement**: Render persistent containers provide better WebSocket performance vs Vercel serverless

**August 6, 2025**: Complete production authentication and form population fix
- **Previous Fix**: AI Providers CRUD operations and authentication standardization completed
- **UI Enhancement**: Model Fusion icon changed from Brain to ShieldCheck for security theme alignment

## System Architecture
**Frontend Architecture**: React 18 with TypeScript, Pure CSS with inline styles, TanStack Query for server state, Wouter for routing, and Vite for builds.
**Backend Architecture**: Node.js with Express.js, PostgreSQL with Drizzle ORM, Replit Auth for authentication, Express sessions for session management, and WebSocket support for real-time communication.
**Key Design Decisions**:
- **Monorepo Structure**: Shared schemas and types between client and server for type safety across the stack.
- **Database-First Approach**: PostgreSQL chosen for ACID compliance and complex queries.
- **Pure CSS Implementation**: Inline styles used throughout for guaranteed production consistency and cross-environment compatibility.
- **Logo Standardization**: Atomic/molecular logo design (`ai-sentinel-logo.png`) used consistently.
- **UI/UX**: Clean, professional enterprise aesthetic with standardized card-based layouts. Blue gradient headers, orange Edit buttons (#f97316), and red Delete buttons (#ef4444) provide consistent styling across all admin pages. Company branding (logo, name) is prominently displayed and configurable.
- **Authentication System**: Replit Auth integration with PostgreSQL-backed sessions, role-based access with hierarchical levels (998+ admin, 999+ owner, 1000+ super-user), and secure HTTP-only cookies.
- **AI Integration**: Support for multiple AI providers (OpenAI, Anthropic), configurable AI models with company-specific organization IDs, and structured response handling. Universal template system for AI models.
- **Content Security**: Multi-layered content filtering, PII detection, security flagging, and compliance tracking.
- **Administrative Features**: Real-time dashboard, configuration management for models and activity types, analytics, and report export. All admin panel pages load existing data correctly. Standardized card-based UI design implemented across Company Management and AI Providers pages (August 5, 2025). AI Providers page data transformation issue resolved - snake_case database fields properly converted to camelCase for frontend display (August 6, 2025). Production authentication issue completely resolved - AI Providers CRUD operations now work flawlessly in both development and production environments by standardizing authentication token usage across all admin pages (August 6, 2025).
- **Data Flow**: Secure user authentication with company and employee verification. AI interactions flow through content filters and are logged for audit. Real-time updates utilize WebSockets and server-sent events.
- **Deployment Strategy**: Configured for Vercel with serverless functions for API routes and static file serving for the client. Uses Vite for client builds, ESBuild for server, and Drizzle Kit for database migrations. Environment variables manage secrets. Comprehensive monitoring and logging are integrated.

## External Dependencies
**Core Services**:
- **Database**: Railway PostgreSQL
- **Authentication**: Replit Auth
- **AI Providers**: OpenAI, Anthropic
**Development Tools**:
- **Vite**: Build tool
- **Drizzle Kit**: Database migrations
- **ESBuild**: Server code bundling
**UI Libraries**:
- **Radix UI**: Headless component primitives
- **Pure CSS**: All styling
- **Lucide React**: Icon library