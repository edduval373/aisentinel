# AI Sentinel - Complete Backup Restoration Guide

## Backup Information
- **Created**: January 21, 2025
- **Version**: Production-ready with comprehensive credit card-required pricing system
- **Database**: PostgreSQL with complete subscription schema
- **Status**: Fully functional enterprise AI governance platform

## What's Included in This Backup

### Core Application Files
- Complete React TypeScript frontend with shadcn/ui components
- Express.js backend with comprehensive API routes
- PostgreSQL database schema with Drizzle ORM
- Authentication system with Replit Auth integration
- Subscription management with credit card validation requirements

### Key Features Implemented
1. **Comprehensive Pricing System**
   - Trial ($0), Personal ($9.99), Company ($50) pricing tiers
   - Mandatory credit card validation for all users including trials
   - Complete subscription database schema and API routes

2. **Enterprise Authentication**
   - Role-based access control (super-user, owner, admin, user)
   - Company-based multi-tenancy with data isolation
   - Session management with PostgreSQL store

3. **AI Integration**
   - OpenAI, Anthropic, and Perplexity API support
   - Content filtering and security compliance
   - Model fusion capabilities for enhanced responses

4. **Administrative Features**
   - Complete admin dashboard with company management
   - Real-time monitoring and usage analytics
   - Security settings and content policy management

## Restoration Instructions

### 1. Extract Backup
```bash
tar -xzf AI_SENTINEL_COMPLETE_BACKUP_YYYY_MM_DD_HH_MM_SS.tar.gz
cd ai-sentinel-restored
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a new PostgreSQL database and set the connection string:
```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@host:port/database"

# Push schema to database
npm run db:push
```

### 4. Environment Variables
Create `.env` file with required variables:
```env
DATABASE_URL=postgresql://username:password@host:port/database
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
SENDGRID_API_KEY=your_sendgrid_key
APP_URL=http://localhost:5000
NODE_ENV=development
```

### 5. Start Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Database Schema Overview

### Core Tables
- `users` - User accounts with role-based permissions
- `companies` - Multi-tenant company management
- `company_roles` - Hierarchical role system
- `subscriptionPlans` - Pricing tier definitions
- `userSubscriptions` - User subscription tracking
- `paymentMethods` - Secure payment method storage
- `apiUsageTracking` - Usage monitoring and limits

### AI & Content Management
- `aiModels` - AI provider and model configurations
- `activityTypes` - Pre-prompt and activity categorization
- `chatSessions` - Conversation management
- `chatMessages` - Message storage with company isolation
- `chatAttachments` - File upload and processing

### Security & Compliance
- `userActivities` - Audit trail for all user actions
- `modelFusionConfigs` - Advanced AI model orchestration
- `trialUsage` - Trial period tracking and enforcement

## Key Configuration Files

### Package Management
- `package.json` - All dependencies and scripts
- `drizzle.config.ts` - Database configuration
- `tsconfig.json` - TypeScript configuration

### Build & Deployment
- `vite.config.ts` - Development build configuration
- `vite.config.production.ts` - Production build configuration
- `vercel.json` - Vercel deployment configuration
- `api/index.ts` - Serverless function entry point

### Styling & UI
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui component configuration
- `client/src/index.css` - Global styles and theme

## Security Notes

### API Key Management
- All API keys must be provided via environment variables
- No hardcoded keys in the codebase
- Secure storage and rotation capabilities implemented

### Credit Card Validation
- Mandatory for all users including $0 trials
- Prevents abuse and ensures service quality
- Ready for Stripe integration

### Data Protection
- Complete company data isolation
- Role-based access controls at all levels
- Comprehensive audit logging

## Production Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy using provided configuration files

### Database Requirements
- PostgreSQL 12+ recommended
- Connection pooling for production scale
- Regular backups and monitoring

## Support & Maintenance

### Monitoring
- Built-in health check endpoints
- Usage analytics and reporting
- Error tracking and logging

### Updates
- Modular architecture for easy updates
- Database migrations via Drizzle
- Feature flags for controlled rollouts

## Project Architecture Summary

### Frontend (React + TypeScript)
- Modern component-based architecture
- TanStack Query for state management
- Wouter for lightweight routing
- shadcn/ui for consistent design system

### Backend (Express.js)
- RESTful API design
- Middleware-based authentication
- Service layer architecture
- Comprehensive error handling

### Database (PostgreSQL + Drizzle)
- Type-safe ORM with schema validation
- Company-based multi-tenancy
- Optimized queries and indexing
- Migration management

This backup represents a complete, production-ready enterprise AI governance platform with comprehensive security, subscription management, and multi-tenant capabilities.