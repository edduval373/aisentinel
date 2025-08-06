# Database Field Mapping - AI Model Templates

## Verified Database Schema (snake_case)
Based on direct database query from `ai_model_templates` table:

```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'ai_model_templates';
```

| Database Field (snake_case) | Frontend Field (camelCase) | Data Type | Required |
|----------------------------|---------------------------|-----------|----------|
| `id` | `id` | integer | Auto |
| `name` | `name` | varchar | Yes |
| `provider` | `provider` | varchar | Yes |
| `model_id` | `modelId` | varchar | Yes |
| `description` | `description` | text | No |
| `context_window` | `contextWindow` | integer | No (default: 4096) |
| `is_enabled` | `isEnabled` | boolean | No (default: true) |
| `capabilities` | `capabilities` | jsonb | No |
| `api_endpoint` | `apiEndpoint` | text | Yes |
| `auth_method` | `authMethod` | varchar | No (default: 'bearer') |
| `request_headers` | `requestHeaders` | jsonb | No |
| `max_tokens` | `maxTokens` | integer | No (default: 1000) |
| `temperature` | `temperature` | real | No (default: 0.7) |
| `max_retries` | `maxRetries` | integer | No (default: 3) |
| `timeout` | `timeout` | integer | No (default: 30000) |
| `rate_limit` | `rateLimit` | integer | No (default: 100) |
| `created_at` | `createdAt` | timestamp | Auto |

## API Transformation
- **GET**: Database returns snake_case → Transform to camelCase for frontend
- **POST**: Frontend sends camelCase → Transform to snake_case for database
- **PUT**: Frontend sends camelCase → Transform to snake_case for database

## Sample Data
```json
// Database (snake_case):
{
  "id": 1,
  "name": "GPT-4o",
  "model_id": "gpt-4o",
  "context_window": 128000,
  "is_enabled": true
}

// Frontend (camelCase):
{
  "id": 1,
  "name": "GPT-4o", 
  "modelId": "gpt-4o",
  "contextWindow": 128000,
  "isEnabled": true
}
```