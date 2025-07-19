# AI Sentinel - Enterprise AI Governance Platform

A comprehensive enterprise AI governance platform that provides secure, compliant, and monitored AI interactions for organizations.

## Features

- **Multi-Model AI Support**: OpenAI, Anthropic, Perplexity integration
- **Email-Based Authentication**: Secure cookie-based sessions with email verification
- **Company-Based Access Control**: Role-based permissions with company isolation
- **Model Fusion**: Run prompts across multiple AI models simultaneously
- **Document Processing**: Support for Excel, PDF, and Word documents
- **Real-time Chat**: WebSocket-based AI interactions
- **Administrative Dashboard**: Complete management interface for AI governance

## Deployment

### Vercel Deployment

1. **Fork/Clone to GitHub**
2. **Connect to Vercel**
3. **Set Environment Variables**:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SENDGRID_API_KEY=your_sendgrid_api_key
   APP_URL=your_deployed_app_url
   NODE_ENV=production
   ```
4. **Deploy**

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SENDGRID_API_KEY`: SendGrid API key for email verification
- `APP_URL`: Your deployed application URL
- `NODE_ENV`: Set to 'production' for deployment

## Local Development

```bash
npm install
npm run dev
```

## Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Cookie-based sessions with email verification
- **Email**: SendGrid integration
- **AI**: OpenAI, Anthropic, Perplexity APIs
- **Deployment**: Vercel

## Architecture

The application follows a monorepo structure with shared schemas and types between client and server. It uses a database-first approach with PostgreSQL for ACID compliance and complex queries.

## License

MIT