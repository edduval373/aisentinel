import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const databaseUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

console.log("Database URL preview:", databaseUrl?.substring(0, 50) + "...");

if (!databaseUrl) {
  throw new Error(
    "RAILWAY_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For now, let's use the original Neon database as fallback while we fix Railway connection
if (databaseUrl.includes("${{") || databaseUrl.includes("base")) {
  console.log("WARNING: DATABASE_URL contains variable references. Using fallback database.");
  // Use the original connection temporarily
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });