// Workarounds for Drizzle Kit bugs when pulling Supabase's auth schema.
// Remove if fixed upstream.
//
// Bug 1: Empty string column defaults (DEFAULT '') are emitted as .default(')
//        instead of .default('').
//
// Bug 2: bytea columns are emitted as unknown("col") which is invalid TypeScript
//        (unknown is a type keyword, not a function). Replaced with text() since
//        these are auth-internal columns we never query.
import { readFileSync, writeFileSync } from "fs";

const path = "./src/lib/drizzle/schema.ts";
const fixed = readFileSync(path, "utf8")
  .replace(/\.default\('\)/g, ".default('')")
  .replace(/\bunknown\(/g, "text(");
writeFileSync(path, fixed);
