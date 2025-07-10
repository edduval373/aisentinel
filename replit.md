# AI Sentinel - Enterprise AI Governance Platform

## Overview

AI Sentinel is a comprehensive enterprise AI governance platform that provides secure, compliant, and monitored AI interactions for organizations. The application combines a React frontend with an Express.js backend, featuring real-time chat capabilities, content filtering, and administrative oversight.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Communication**: WebSocket support for live features

### Key Design Decisions
- **Monorepo Structure**: Shared schemas and types between client and server
- **Database-First Approach**: PostgreSQL chosen for ACID compliance and complex queries
- **Component-Based UI**: shadcn/ui for consistent, accessible components
- **Type Safety**: Full TypeScript implementation across the stack

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Session Storage**: PostgreSQL-backed sessions for persistence
- **Role-Based Access**: User and admin roles with route protection
- **Security**: HTTP-only cookies with secure session management

### AI Integration
- **Multiple Providers**: OpenAI and Anthropic API support
- **Model Management**: Configurable AI models with enable/disable controls
- **Default Models**: Claude Sonnet 4 (latest) and GPT-4o
- **Response Handling**: Structured error handling and rate limiting

### Content Security
- **Content Filtering**: Multi-layered security system
- **PII Detection**: Pattern-based detection for sensitive information
- **Security Flags**: Real-time flagging of policy violations
- **Compliance Tracking**: Activity logging for audit trails

### Administrative Features
- **Real-time Dashboard**: Live monitoring of AI interactions
- **Configuration Management**: Model and activity type administration
- **Analytics**: Usage statistics and security metrics
- **Export Capabilities**: Report generation for compliance

## Data Flow

### User Authentication Flow
1. User accesses protected route
2. Middleware checks session validity
3. Redirects to Replit Auth if unauthenticated
4. Creates/updates user record on successful auth
5. **Company-based authorization**: Checks if user's email domain matches registered company
6. **Employee verification**: Validates user is on company's authorized employee list
7. Establishes session with role-based permissions and company association

### AI Interaction Flow
1. User selects AI model and activity type
2. Message passes through content filter
3. Security flags applied if violations detected
4. AI service processes approved messages
5. Response filtered before delivery
6. All interactions logged for audit

### Real-time Updates
1. WebSocket connections for live features
2. Server-sent events for dashboard updates
3. Optimistic updates with error rollback
4. Connection status monitoring

## External Dependencies

### Core Services
- **Database**: Railway PostgreSQL for managed database hosting
- **Authentication**: Replit Auth for OIDC integration
- **AI Providers**: OpenAI and Anthropic for language models

### Development Tools
- **Vite**: Build tool with hot module replacement
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling for server code

### UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography

## Deployment Strategy

### Build Process
1. **Client Build**: Vite compiles React app to static assets
2. **Server Build**: ESBuild bundles Express server with externals
3. **Database Migration**: Drizzle pushes schema changes
4. **Asset Optimization**: Automatic code splitting and minification

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Single-binary deployment with static serving
- **Database**: Connection string-based configuration
- **Secrets**: Environment variable management for API keys

### Monitoring and Logging
- **Request Logging**: Structured logging with response times
- **Error Tracking**: Comprehensive error handling with stack traces
- **Performance Metrics**: Response time and throughput monitoring
- **Security Auditing**: All user activities logged with timestamps

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
- July 07, 2025. Enhanced MessageRenderer with intelligent content detection:
  * Added support for JSON table conversion (handles nested objects like Perplexity format)
  * Enhanced HTML table rendering from code blocks
  * Improved markdown table detection and styling
  * Implemented model-specific content format handling
  * Added responsive table design with scroll capability
- July 07, 2025. Redesigned layout with collapsible sidebar:
  * Created collapsible sidebar that starts closed with menu button toggle
  * Added comprehensive admin navigation with expandable sections
  * Organized admin controls: AI Management, Activity Management, User Management, Monitoring, System Settings
  * Fixed layout issues where header disappeared during content loading
  * Improved mobile responsiveness with overlay and proper transitions
- July 09, 2025. Implemented comprehensive admin functionality:
  * Created all admin pages: AI Models, Activity Types, Users, Content Policies, Activity Logs, Security Reports
  * Fixed admin section visibility with proper authorization checks
  * Resolved message submission errors (empty error objects causing false notifications)
  * Added missing UI components (Textarea) and updated routing for all admin sections
  * Replaced menu icon with custom AI Sentinel logo throughout the application
- July 09, 2025. Completed all remaining admin pages to fix 404 errors:
  * Added Roles & Permissions page with role management and permission categories
  * Created Usage Analytics page with metrics, charts, and performance monitoring
  * Implemented API Configuration page for managing API keys and settings
  * Added Security Settings page with content filtering and access controls
  * Created Permissions page for activity-specific access controls
  * Updated App.tsx routing to include all new admin pages
  * Replaced admin panel icon with atomic structure design (white on black)
  * Refined chat header spacing and increased text size by 20%
- July 09, 2025. Enhanced AI model support and functionality:
  * Added Perplexity AI model integration with proper API implementation
  * Created comprehensive Model Settings admin page with detailed configuration options
  * Fixed header disappearing issue in chat interface with proper CSS layout constraints
  * Implemented fully functional Invite User dialog with form validation
  * Replaced all admin menu icons with AI Sentinel icon for consistent branding
  * Updated AI service to support Perplexity API calls with real-time information capabilities
- July 09, 2025. Implemented functional Activity Types management with pre-prompt system:
  * Updated database schema to include prePrompt, riskLevel, and permissions fields for activity types
  * Created fully functional Add Activity Type dialog with comprehensive form validation
  * Implemented database-driven Activity Types admin page replacing hardcoded content
  * Added pre-prompt functionality to guide AI behavior based on selected activity type
  * Updated AI service to use activity-specific system prompts for all providers (OpenAI, Anthropic, Perplexity)
  * Added toggle functionality for enabling/disabling activity types
  * Enhanced UI to display pre-prompts, risk levels, and permissions for each activity type
  * Initialized default activity types with specific pre-prompts for different use cases
- July 10, 2025. Implemented company-based authentication system:
  * Added companies and company_employees tables to database schema
  * Created automatic company assignment based on email domain matching
  * Implemented employee authorization system for controlled access
  * Added company management routes and storage methods
  * Users are now automatically signed in if they're on their company's employee list
  * Enhanced authentication flow to include company-based verification
  * Added admin routes for company and employee management
- July 10, 2025. Enhanced role-based access control and integrated company management:
  * Created super-user role system with automatic assignment for first user
  * Implemented three-tier access: super-user (system management), admin (AI management), regular user (chat only)
  * Integrated employee management directly into company admin interface with tabbed navigation
  * Added role-based sidebar visibility controls for different user types
  * Super-users can now manage companies and employees in unified interface
  * Fixed routing issues with dynamic imports causing React rendering errors
  * Enhanced company setup to require primary administrator contact information (name, email, title)
  * Added database fields for tracking company's primary administrator details
  * Updated company creation form with mandatory admin contact validation
- July 10, 2025. Simplified user interface and enhanced company branding:
  * Removed complex employee management tabs, keeping only streamlined user setup
  * Added company logo upload capability to company creation form
  * Reorganized header layout to display company name and logo on top left
  * Moved AI Sentinel branding (logo and text) to top right of header
  * Updated sidebar navigation to link to simplified User Setup instead of Employee Management
  * Fixed database schema issues with company table structure and primary admin fields
- July 10, 2025. Streamlined admin panel with enhanced company ownership management:
  * Consolidated admin panel to single "Company Management" option for super-users
  * Replaced employee management with multiple company owners system
  * Added owner roles (owner/admin) with dedicated management interface
  * Implemented add/remove owners functionality with form validation
  * Enhanced company cards with "Manage Owners" button for direct access
  * Simplified navigation structure removing duplicate company management options
- July 10, 2025. Enhanced company logo handling and direct admin access:
  * Changed company logo from URL input to file picker with base64 encoding
  * Removed "URL" text from logo field label for cleaner interface
  * Modified admin route to go directly to Company Management instead of overview page
  * Added Company Management as main navigation item for super-users
  * Removed redundant expandable company management section from sidebar
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```