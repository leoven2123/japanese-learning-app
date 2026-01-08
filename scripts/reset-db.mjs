import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import "dotenv/config";

async function resetDatabase() {
  console.log("Connecting to database...");
  const db = drizzle(process.env.DATABASE_URL);

  try {
    console.log("Dropping existing tables...");
    
    // Drop tables in correct order to avoid foreign key constraints
    const tables = [
      'exerciseAttempts',
      'exercises', 
      'learningRecords',
      'sceneGrammar',
      'sceneVocabulary',
      'examples',
      'grammar',
      'vocabulary',
      'scenes',
      'studySessions',
      'users'
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS \`${table}\``));
        console.log(`✓ Dropped table: ${table}`);
      } catch (error) {
        console.log(`- Table ${table} does not exist or already dropped`);
      }
    }

    console.log("\n✓ Database reset complete!");
    console.log("Now run: pnpm db:push");
    
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

resetDatabase();
