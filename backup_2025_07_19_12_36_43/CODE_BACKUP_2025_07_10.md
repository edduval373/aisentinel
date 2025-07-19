# AI Sentinel - Complete Code Backup
## Date: July 10, 2025

This is a comprehensive backup of the AI Sentinel project codebase including all critical files and their current state.

## Project Overview
AI Sentinel is a comprehensive enterprise AI governance platform providing controlled, secure, and intelligent chat interactions with administrative capabilities and multi-model support.

### Key Features:
- React TypeScript frontend with robust routing
- PostgreSQL database integration via Drizzle ORM
- Advanced role-based access control (super-user, owner, admin, regular user)
- Comprehensive company and employee management system
- Multi-model AI provider support (OpenAI, Anthropic, Perplexity)
- Advanced security and monitoring features
- Responsive UI with enhanced navigation and custom branding

### Current Role Hierarchy:
- **SUPER-USER**: Can see all options (SUPER-USER, OWNERS, ADMINISTRATION sections)
- **OWNERS**: Can see OWNERS and ADMINISTRATION sections + AI Chat
- **ADMIN**: Can only see ADMINISTRATION section + AI Chat
- **USERS**: Cannot open the sidebar panel at all

### Architecture Stack:
- Frontend: React 18 + TypeScript + Vite
- Backend: Node.js + Express.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Replit Auth with OpenID Connect
- Styling: Tailwind CSS + shadcn/ui components
- Real-time: WebSocket support

### Project Structure:
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility libraries
├── server/                 # Express backend
│   ├── services/           # Business logic services
│   └── *.ts               # Server configuration files
├── shared/                 # Shared types and schemas
└── attached_assets/        # Project assets and logos
```

## Database Schema Summary

### Core Tables:
1. **sessions** - Replit Auth session management
2. **companies** - Company information and settings
3. **companyEmployees** - Employee authorization lists
4. **users** - User profiles and role assignments
5. **aiModels** - AI model configurations
6. **activityTypes** - Activity type definitions with pre-prompts
7. **userActivities** - Activity logging and audit trail
8. **chatSessions** - Chat session management
9. **chatMessages** - Individual chat messages and responses

### Key Database Features:
- Automatic super-user assignment for first user
- Company-based authentication with email domain matching
- Employee authorization system
- Activity logging with security flags
- Content filtering and PII protection

## API Endpoints Summary

### Authentication:
- `GET /api/auth/user` - Get current user info
- `GET /api/login` - Initiate login flow
- `GET /api/logout` - Logout user

### Company Management (Super-user only):
- `GET /api/admin/companies` - List all companies
- `POST /api/admin/companies` - Create new company
- `PATCH /api/admin/companies/:id` - Update company
- `DELETE /api/admin/companies/:id` - Delete company
- `POST /api/admin/company-employees` - Add employee
- `GET /api/admin/company-employees/:companyId` - List employees

### AI Models:
- `GET /api/ai-models` - Get enabled models
- `GET /api/admin/ai-models` - Get all models (admin)
- `POST /api/admin/ai-models` - Create model (admin)
- `PATCH /api/admin/ai-models/:id` - Update model (admin)

### Activity Types:
- `GET /api/activity-types` - Get enabled types
- `GET /api/admin/activity-types` - Get all types (admin)
- `POST /api/admin/activity-types` - Create type (admin)
- `PATCH /api/admin/activity-types/:id` - Update type (admin)

### Chat & Activities:
- `POST /api/chat/message` - Send chat message
- `POST /api/chat/session` - Create chat session
- `GET /api/chat/session/:id/messages` - Get session messages
- `GET /api/user-activities` - Get user's activities
- `GET /api/admin/user-activities` - Get all activities (admin)
- `GET /api/admin/stats` - Get activity statistics (admin)

## Security Features

### Content Filtering:
- PII detection (SSN, credit cards, phone numbers, emails)
- Financial data detection (revenue, profit, salary terms)
- Sensitive keyword filtering (confidential, proprietary, passwords)
- Code vulnerability scanning (API keys, tokens, secrets)
- URL filtering (internal, private, staging URLs)
- Data leakage prevention (structured data patterns)

### Authentication & Authorization:
- Replit Auth integration with OpenID Connect
- Role-based access control with strict hierarchies
- Company-based user authorization
- Session management with PostgreSQL store
- Employee verification system

### AI Safety:
- Activity-specific pre-prompts for AI behavior guidance
- Risk level assessment (low, medium, high)
- Response filtering and monitoring
- Activity logging with security flags
- Real-time blocking of policy violations

## Configuration Files

### Environment Variables Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic Claude API access
- `PERPLEXITY_API_KEY` - Perplexity API access
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit application ID
- `REPLIT_DOMAINS` - Allowed domains for auth

### Build Configuration:
- Vite for frontend development and building
- ESBuild for server compilation
- Drizzle Kit for database migrations
- Tailwind CSS for styling
- PostCSS for CSS processing

## Recent Major Changes (July 2025)

### July 10, 2025 Updates:
1. **Role-based Sidebar Implementation**: Complete reorganization with SUPER-USER, OWNERS, and ADMINISTRATION sections
2. **Company Management System**: Full CRUD operations for super-users with file upload support
3. **Database Schema Fixes**: Removed problematic settings column, improved constraints
4. **Multi-role Access Control**: Strict hierarchy enforcement with proper access levels
5. **AI Model Integration**: Enhanced support for Perplexity API alongside OpenAI and Anthropic
6. **Activity Type Pre-prompts**: Functional pre-prompt system for AI behavior guidance
7. **Company-based Authentication**: Automatic user assignment based on email domain matching

### UI/UX Improvements:
- Collapsible sidebar with role-based visibility
- Custom AI Sentinel branding throughout
- Enhanced header layout with company/logo display
- Responsive design with mobile support
- Streamlined navigation structure

### Security Enhancements:
- Multi-layered content filtering system
- Real-time policy violation detection
- Enhanced PII and financial data protection
- Comprehensive audit logging
- Role-based route protection

## Deployment Notes

### Requirements:
- Node.js 18+ environment
- PostgreSQL database
- Environment variables configured
- Domain configured for Replit Auth

### Build Process:
1. Frontend: `npm run build` (Vite compilation)
2. Server: Automatic ESBuild bundling
3. Database: `npm run db:push` (Drizzle migrations)
4. Assets: Automatic optimization and serving

### Monitoring:
- Real-time WebSocket connections
- Activity logging and statistics
- Error tracking with stack traces
- Performance metrics and response times
- Security audit trails

---

**This backup represents the complete state of the AI Sentinel project as of July 10, 2025, after implementing comprehensive role-based access control and company management features.**