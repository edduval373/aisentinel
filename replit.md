# AI Sentinel - Enterprise AI Governance Platform

## Overview
AI Sentinel is a comprehensive enterprise AI governance platform designed to provide secure, compliant, and monitored AI interactions for organizations. It aims to prevent unauthorized changes to tested code sections and offers real-time chat capabilities, content filtering, and administrative oversight. The vision is to establish a robust solution for managing AI usage within enterprises, ensuring data protection and regulatory compliance.

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

## System Architecture
**Frontend Architecture**: React 18 with TypeScript, Pure CSS with inline styles, TanStack Query for server state, Wouter for routing, and Vite for builds.
**Backend Architecture**: Node.js with Express.js, PostgreSQL with Drizzle ORM, Replit Auth for authentication, Express sessions for session management, and WebSocket support for real-time communication.
**Key Design Decisions**:
- **Monorepo Structure**: Shared schemas and types between client and server.
- **Database-First Approach**: PostgreSQL chosen for ACID compliance and complex queries.
- **Pure CSS Implementation**: Inline styles used throughout for guaranteed production consistency.
- **Logo Standardization**: Atomic/molecular logo design (`ai-sentinel-logo.png`) used consistently.
- **Type Safety**: Full TypeScript implementation across the stack.
- **UI/UX**: Focus on a clean, professional enterprise aesthetic. Company branding (logo, name) is prominently displayed and configurable. Layouts are card-based with consistent styling.
- **Authentication System**: Replit Auth integration with PostgreSQL-backed sessions, role-based access with hierarchical levels (998+ admin, 999+ owner, 1000+ super-user), and secure HTTP-only cookies.
- **AI Integration**: Support for multiple AI providers (OpenAI, Anthropic), configurable AI models with company-specific organization IDs, and structured response handling.
- **Content Security**: Multi-layered content filtering, PII detection, security flagging, and compliance tracking.
- **Administrative Features**: Real-time dashboard, configuration management for models and activity types, analytics, and report export. All admin panel pages load existing data correctly with proper API endpoint patterns.
- **Data Flow**: Secure user authentication with company and employee verification. AI interactions flow through content filters and are logged for audit. Real-time updates utilize WebSockets and server-sent events.
- **Deployment Strategy**: Configured for Vercel with serverless functions for API routes and static file serving for the client. Uses Vite for client builds, ESBuild for server, and Drizzle Kit for database migrations. Environment variables manage secrets. Comprehensive monitoring and logging are integrated.

## Recent Fixes (August 2025)
- **CRITICAL: Railway PostgreSQL Database Integration (Aug 3, 2025)**: REMOVED ALL MOCK DATA - Complete integration with Railway PostgreSQL database for all company CRUD operations. Company updates now persist directly to database with proper SQL queries, field mapping, and transaction handling.
- **Three-Column Grid Layout (Aug 3, 2025)**: Transformed company management from single column to responsive three-column grid layout for efficient management of multiple companies. Added compact card design with hover effects and optimized spacing.
- **Complete CRUD Operations (Aug 3, 2025)**: Enabled full Create, Read, Update, Delete operations for super-users (1000+ level) with proper authentication, field mapping, and automatic UI refresh after updates.
- **CRITICAL: Production Authentication Fixed (Aug 3, 2025)**: Implemented dual authentication system with production fallback to resolve Vercel serverless function failures. Chat interface now accessible in production via localStorage account restoration.
- **Universal AI Model Template System**: Implemented template-based AI model architecture where super-users (1000+) create universal templates, owners (999+) manage company API keys
- **Authentication Data Flow**: Fixed companyId inclusion in `/api/auth/me` response and useAuth hook to properly support company-specific features
- **Account Dropdown**: Fixed localStorage parsing logic to properly recognize saved accounts instead of creating test accounts
- **Template Database**: Added 8 universal AI model templates (GPT-4o, Claude Sonnet 4, etc.) and company API key management
- **Role-Based API Access**: Super-users manage universal templates via `/api/admin/ai-model-templates`, owners manage API keys via `/api/admin/company-api-keys`
- **Chat Interface**: AI models now load based on company's configured API keys, defaulting to demo mode when no valid keys exist
- **UI Layout**: Moved account dropdown to main header replacing Sign Out link, added deletion confirmation modal
- **Production Build**: Fixed missing `buttonVariants` export causing Vercel deployment failures by adding proper component exports without using Tailwind CSS
- **Backup Protection**: Created comprehensive backup system to preserve working authentication solution (AUTHENTICATION_IS_WORKING_BACKUP_2025_08_03_09_37_23.tar.gz)

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