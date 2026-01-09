import { db } from '../server/db.ts';
import { learningUnits } from '../drizzle/schema.ts';
import { like } from 'drizzle-orm';

const units = await db.select().from(learningUnits).where(like(learningUnits.title, '%謙虚%'));
console.log(JSON.stringify(units, null, 2));
process.exit(0);
