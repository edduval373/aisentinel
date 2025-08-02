import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use the standard DATABASE_URL for database connections
const databaseUrl = process.env.DATABASE_URL;

console.log("Database URL preview:", databaseUrl?.substring(0, 50) + "...");

// Use DATABASE_URL directly without internal networking modifications
let connectionString = null;

if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
  connectionString = databaseUrl;
  console.log("Using DATABASE_URL");
}

if (!connectionString) {
  throw new Error(
    "Need a valid PostgreSQL connection string starting with 'postgresql://' or 'postgres://' in DATABASE_URL"
  );
}

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5, // Maximum number of connections in the pool
  idleTimeoutMillis: 1000, // Close idle connections after 1 second
  connectionTimeoutMillis: 3000 // Timeout connection attempts after 3 seconds
});

export const db = drizzle(pool, { schema });