# AI Sentinel - Enterprise AI Governance Platform

An advanced enterprise AI governance platform that provides intelligent multi-model document processing and secure chat interactions with comprehensive AI integration capabilities.

## Features

- **Multi-Model AI Support**: OpenAI, Anthropic, and Perplexity integration
- **Advanced Model Fusion Technology**: Intelligent model selection and routing
- **Enterprise Security**: Content filtering, PII detection, and audit trails  
- **Role-Based Access Control**: Super-user, admin, and user roles
- **Company Management**: Multi-tenant architecture with company isolation
- **Document Processing**: Excel and PDF upload capabilities
- **Real-time Chat Interface**: WebSocket-powered conversations
- **Comprehensive Admin Panel**: Model management, activity monitoring

## Technology Stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Deployment**: Vercel serverless functions

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-sentinel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://username:password@host:port/database
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
SESSION_SECRET=your_session_secret
SENDGRID_API_KEY=your_sendgrid_key
APP_URL=https://your-domain.com
ENABLE_REPLIT_AUTH=true
```

## Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Import your repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Build Settings**
   - Build Command: `node build.js`
   - Output Directory: `dist`

3. **Deploy**
   - Vercel will automatically deploy on git push

## Database Schema

The application uses a comprehensive PostgreSQL schema including:

- **Users & Authentication**: User profiles, sessions, email verification
- **Companies**: Multi-tenant company management with employee authorization
- **AI Models**: Configurable AI providers and models
- **Chat System**: Sessions, messages, and activity tracking
- **Security**: Activity logs, content filtering, audit trails

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/user/current-company` - Get user's company

### AI Models
- `GET /api/ai-models` - List AI models
- `POST /api/ai-models` - Create AI model
- `PUT /api/ai-models/:id` - Update AI model

### Chat
- `GET /api/chat/sessions` - List chat sessions
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/messages` - Send chat message

## Development

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database layer
├── shared/                 # Shared types
│   └── schema.ts           # Database schema
├── api/                    # Vercel functions
│   └── index.ts            # Entry point
└── dist/                   # Build output
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:client` - Build client only
- `npm run build:server` - Build server only
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open database studio

## Security Features

- **Content Filtering**: Multi-layer security screening
- **PII Detection**: Automatic detection of sensitive information
- **Activity Logging**: Comprehensive audit trails
- **Role-Based Access**: Granular permission system
- **Session Management**: Secure cookie-based sessions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and documentation, contact the development team.