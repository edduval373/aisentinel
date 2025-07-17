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

## Deployment

The application is configured for deployment on Vercel with the following setup:

### Vercel Configuration
- **Serverless Functions**: API routes handled by `/api/index.ts`
- **Static Files**: Client built to `/dist` directory
- **Build Process**: Vite for client, esbuild for server
- **Environment Variables**: DATABASE_URL, SENDGRID_API_KEY, APP_URL required

### Deployment Files
- `vercel.json`: Vercel configuration for builds and routing
- `api/index.ts`: Serverless function entry point
- `VERCEL_SETUP.md`: Complete deployment guide
- `.vercelignore`: Files excluded from deployment

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SENDGRID_API_KEY`: SendGrid API key for email verification
- `APP_URL`: Deployed application URL
- `NODE_ENV`: Set to 'production'

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
- July 10, 2025. Created comprehensive company management system for super-users:
  * Built full CRUD operations: create, read, update, delete companies
  * Restricted access to super-user role only with proper authentication
  * Added company grid view with edit/delete actions on each card
  * Implemented file picker for logo uploads and complete company information forms
  * Created streamlined interface focused on essential company data management
  * Added confirmation dialogs for destructive actions like company deletion
- July 10, 2025. Restructured sidebar navigation per user requirements:
  * Moved "SUPER-USER" header above "Company Management" section
  * Added "Owners" header above "Company Setup" section  
  * Moved "API Configuration" under the "Owners" section with other owner controls
  * Fixed database schema by removing problematic settings column
  * Organized sidebar hierarchy: SUPER-USER → Company Management → Owners → Company Setup
- July 10, 2025. Final sidebar reorganization to streamline navigation:
  * Removed User Management and Monitoring & Reports from Owners section
  * Moved AI Management from admin section to Owners section
  * Removed Owners subsection from OWNERS header
  * Simplified structure: Company Setup under Owners, AI Management under Owners
  * Clean separation between super-user company management and owner controls
- July 10, 2025. Implemented comprehensive role-based sidebar access control:
  * SUPER-USER: Can see all options (SUPER-USER, OWNERS, ADMINISTRATION sections)
  * OWNERS: Can see OWNERS and ADMINISTRATION sections + AI Chat
  * ADMIN: Can only see ADMINISTRATION section + AI Chat
  * USERS: Cannot open the sidebar panel at all
  * Strict role hierarchy enforcing proper access levels
- July 10, 2025. Final UI improvements to company management interface:
  * Changed "Company Owners" section label to simply "Owners" as requested
  * Consolidated duplicate "Setup Company" entries into single panel entry
  * Fixed database schema issues with logo field to support base64 image storage
  * Company creation functionality now fully operational with large image support
  * Resolved all payload size limitations and API parameter ordering issues
  * Clarified interface distinction: "Company Management" (super-user system administration) vs "Setup Company" (owner company configuration)
- July 10, 2025. Implemented complete multi-tenancy architecture with company-based data isolation:
  * Added company_id columns to all user-generated content tables (aiModels, activityTypes, userActivities, chatSessions, chatMessages)
  * Updated database schema with proper foreign key relationships and company isolation
  * Modified storage layer to filter all operations by company context (companyId = CurrentCompId)
  * Updated route handlers to enforce company-based access control and data filtering
  * Implemented company context provider on frontend for persistent company association
  * All data queries now properly isolated by company ensuring complete tenant separation
  * Removed global initialization in favor of per-company data creation system
- July 10, 2025. Enhanced chat interface company information display:
  * Added company information display to chat screen header in top right corner
  * Created API endpoint (/api/user/current-company) to fetch current user's company details
  * Updated display format to match AI Sentinel Dashboard style with logo and company name
  * Company ID now shows in parentheses after company name (e.g., "Horizon Edge Enterprises (1)")
  * Simplified layout with inline styling and compact logo design
- July 10, 2025. Final header layout improvements:
  * Moved AI Sentinel logo and text to top right corner, changed "Dashboard" to "Chat"
  * Replaced hamburger menu with AI Sentinel logo for consistent branding
  * Positioned company logo, name, and ID next to menu button on top left
  * Created clean visual hierarchy: menu logo → company info (left) | AI Sentinel branding (right)
- July 10, 2025. Implemented hierarchical role-based permission system:
  * Created company_roles table with numerical role levels (super-user: 100, owner: 99, admin: 2, user: 1)
  * Added role management methods to storage layer with proper validation and constraints
  * Updated all API routes to use >= comparisons for flexible permission checking
  * Added complete company role management endpoints with owner/super-user access control
  * Business rule implemented: cannot delete the last owner to maintain company access
  * Enhanced user creation to assign appropriate role levels based on company role structure
- July 11, 2025. Enhanced chat management with full session functionality:
  * Implemented complete chat session history with message counts and preview text
  * Added session restoration - clicking previous chat loads all messages from that session
  * Modified repeat functionality to fill input field instead of auto-submitting for user modification
  * Enhanced session display to show first line of last message instead of generic titles
  * Fixed session history refresh to update immediately when new messages are sent
  * All chat sessions properly isolated by company with Railway PostgreSQL storage
- July 11, 2025. Restructured sidebar navigation and implemented custom AI model creation:
  * Removed duplicate AI Management sections that were opening/closing together
  * Created new "Setup AI Models" section under Owners with comprehensive model creation capabilities
  * Removed AI Models option from AI Management section under Administration
  * Added "Create Models" page for building custom AI models from scratch with full configuration options
  * Implemented "API Configuration" page for managing API keys and settings per provider
  * Added support for multiple AI providers (OpenAI, Anthropic, Perplexity, Google, Cohere, Custom)
  * Created complete model management with capabilities, context windows, temperature settings, and testing functionality
  * Updated Context Management page to use consistent AdminLayout header pattern
- July 11, 2025. Enhanced security and implemented company-specific AI model isolation:
  * Updated database connection to use Railway's internal networking (postgres.railway.internal) for secure API key protection
  * Implemented automatic company-specific model creation - each new company gets its own set of default AI models
  * Added initializeCompanyDefaults method that creates placeholder models with company-specific API keys
  * Enhanced data isolation ensuring AI models and activity types are completely separated by company
  * Added comprehensive default model configurations for OpenAI, Anthropic, and Perplexity providers
  * Created secure placeholder API key system with company-specific naming for easy identification
  * Implemented automatic activity type creation with company-specific pre-prompts for different use cases
- July 12, 2025. Fixed Google Cloud Storage startup error and implemented database-based file storage:
  * Replaced external object storage with database storage approach matching context management system
  * Updated chatAttachments table schema to store file content directly as TEXT instead of external paths
  * Modified FileStorageService to process files into base64 or text format for database storage
  * Fixed FormData parameter parsing in chat message route (string to number conversion)
  * Updated file download endpoint to retrieve files from database instead of external storage
  * Application now starts successfully without requiring Google Cloud Storage configuration
  * Added Excel file support using xlsx library for spreadsheet content extraction
  * Enhanced file processing to extract actual content from Word docs (mammoth) and Excel files (xlsx)
  * Fixed session ID validation in chat messages route to prevent SQL parsing errors
  * AI can now properly read and summarize uploaded documents including .docx and .xlsx files
  * PDF files are accepted but require manual text extraction due to library compatibility issues
- July 12, 2025. Implemented simplified Deep Research functionality:
  * Created deep_research_configs table with company-based configuration
  * Added simple toggle for enabling/disabling Deep Research feature
  * Implemented summary model selection for final analysis consolidation
  * Removed complex model selection interface in favor of using all available models
  * Added Deep Research API endpoints with proper authentication and validation
  * Created streamlined admin interface for Deep Research configuration
  * Deep Research will process prompts across all enabled AI models and summarize results
  * Owner-level access required for Deep Research configuration management
- July 12, 2025. Renamed Deep Research to Model Fusion throughout the application:
  * Updated all database schema references from deepResearchConfigs to modelFusionConfigs
  * Changed API endpoints from /api/deep-research-config to /api/model-fusion-config
  * Updated all storage methods and interface definitions to use ModelFusion terminology
  * Renamed admin page from deep-research.tsx to model-fusion.tsx with updated routing
  * Updated sidebar navigation to show "Setup Model Fusion" instead of "Setup Deep Research"
  * Changed all UI text and descriptions to reference "Model Fusion" instead of "Deep Research"
  * Updated information panels to explain "How Model Fusion Works" with new terminology
  * Maintained all existing functionality while providing clearer, more descriptive naming
- July 17, 2025. Configured complete Vercel deployment environment with GitHub integration:
  * Created comprehensive Vercel configuration (vercel.json) with serverless functions and static file serving
  * Built dedicated serverless API handler (/api/index.ts) with proper Express middleware setup
  * Added GitHub Actions workflow for automated deployment pipeline
  * Created complete deployment documentation (VERCEL_SETUP.md) with step-by-step instructions
  * Configured environment variables for production deployment (DATABASE_URL, SENDGRID_API_KEY, APP_URL)
  * Added .vercelignore file to exclude unnecessary files from deployment
  * Updated README.md with deployment instructions and technology stack overview
  * Created .env.example template for environment variable reference
  * Application now ready for production deployment on Vercel with full functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```