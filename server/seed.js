// Inserts one sample saved program into the shared, public library so the
// Instruction Execution page's "Saved Programs" list isn't empty on a fresh
// database. Safe to re-run — it skips if the sample already exists.
//
// Usage: npm run seed   (inside server/, after `npm install` and schema.sql)

import { pool } from "./db.js";
import { SAMPLE_PROGRAM } from "./sampleProgram.js";

async function main() {
  const [existing] = await pool.query(
    "SELECT id FROM programs WHERE name = 'Array Sum (sample)'"
  );
  if (existing.length === 0) {
    await pool.query(
      "INSERT INTO programs (name, source) VALUES ('Array Sum (sample)', :source)",
      { source: SAMPLE_PROGRAM }
    );
    console.log("Inserted sample program.");
  } else {
    console.log("Sample program already exists, skipping.");
  }

  await pool.end();
  console.log("Seed complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
