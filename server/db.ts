import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Try both RAILWAY_DATABASE_URL and DATABASE_URL
const railwayUrl = process.env.RAILWAY_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

console.log("Railway URL preview:", railwayUrl?.substring(0, 50) + "...");
console.log("Database URL preview:", databaseUrl?.substring(0, 50) + "...");

// Use whichever one is a proper PostgreSQL connection string
let connectionString = null;

if (railwayUrl && (railwayUrl.startsWith('postgresql://') || railwayUrl.startsWith('postgres://'))) {
  connectionString = railwayUrl;
  console.log("Using RAILWAY_DATABASE_URL");
} else if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
  connectionString = databaseUrl;
  console.log("Using DATABASE_URL");
}

if (!connectionString) {
  throw new Error(
    "Need a valid PostgreSQL connection string starting with 'postgresql://' or 'postgres://' in either RAILWAY_DATABASE_URL or DATABASE_URL"
  );
}

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });