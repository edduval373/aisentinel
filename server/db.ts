import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Railway's internal networking for secure connections
const railwayUrl = process.env.RAILWAY_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;

console.log("Railway URL preview:", railwayUrl?.substring(0, 50) + "...");
console.log("Database URL preview:", databaseUrl?.substring(0, 50) + "...");

// Use whichever one is a proper PostgreSQL connection string, preferring Railway's internal network
let connectionString = null;

if (railwayUrl && (railwayUrl.startsWith('postgresql://') || railwayUrl.startsWith('postgres://'))) {
  // Replace external host with internal railway host for secure connections
  connectionString = railwayUrl.replace(
    /postgresql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/,
    'postgresql://$1@postgres.railway.internal:$3/$4'
  );
  console.log("Using RAILWAY_DATABASE_URL with internal networking");
} else if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
  // For non-Railway environments, use as-is
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