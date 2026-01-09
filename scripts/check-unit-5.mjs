import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { learningUnits } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const units = await db.select().from(learningUnits).where(eq(learningUnits.id, 5));
console.log(JSON.stringify(units[0], null, 2));
await connection.end();
process.exit(0);
