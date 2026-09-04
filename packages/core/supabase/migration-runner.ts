#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

export interface RunMigrationsOptions {
  clientName: string;
  connectionString: string;
  /** Root folder containing `<clientName>/migrations`. Defaults to 'clients'. */
  migrationsRoot?: string;
}

/**
 * Applies all pending `.sql` files from `clients/<name>/migrations`, in
 * filename order, against that client's Supabase project. Applied
 * migrations are tracked in a `_migrations` table so re-runs are safe.
 */
export async function runMigrations(options: RunMigrationsOptions): Promise<string[]> {
  const migrationsRoot = options.migrationsRoot ?? 'clients';
  const migrationsDir = join(process.cwd(), migrationsRoot, options.clientName, 'migrations');

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new Client({ connectionString: options.connectionString });
  await client.connect();
  const applied: string[] = [];

  try {
    await client.query(`
      create table if not exists _migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const { rows } = await client.query<{ filename: string }>('select filename from _migrations');
    const alreadyApplied = new Set(rows.map((r) => r.filename));

    for (const file of files) {
      if (alreadyApplied.has(file)) continue;

      const sql = readFileSync(join(migrationsDir, file), 'utf8');

      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into _migrations (filename) values ($1)', [file]);
        await client.query('commit');
        applied.push(file);
      } catch (error) {
        await client.query('rollback');
        throw new Error(`Migration failed: ${file}\n${(error as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }

  return applied;
}

async function main(): Promise<void> {
  const clientName = process.argv[2];
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!clientName) {
    console.error('Usage: tsx migration-runner.ts <clientName>');
    process.exit(1);
  }
  if (!connectionString) {
    console.error('Missing SUPABASE_DB_URL env var (that client\'s Supabase connection string)');
    process.exit(1);
  }

  const applied = await runMigrations({ clientName, connectionString });
  console.log(applied.length > 0 ? `Applied: ${applied.join(', ')}` : 'No pending migrations');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
