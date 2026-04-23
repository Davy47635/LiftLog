import { sql } from 'drizzle-orm';
import { db } from './index';

export async function runMigrations() {
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        colour TEXT NOT NULL,
        icon TEXT NOT NULL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        date TEXT NOT NULL,
        duration_mins INTEGER NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_name TEXT NOT NULL,
        sets INTEGER NOT NULL DEFAULT 1,
        reps INTEGER NOT NULL DEFAULT 1,
        weight_kg REAL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        period TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    console.log('Migrations complete');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
