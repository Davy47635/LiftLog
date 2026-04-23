import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './index';
import migrations from '../drizzle/migrations';

export async function runMigrations() {
  try {
    await migrate(db, migrations);
    console.log('Migrations ran successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}
