import * as core from "@actions/core";
import * as path from "node:path";
import * as fs from "node:fs";
import { execSync } from "node:child_process";

let hasPendingMigrations = false;
const MAX_DEPTH = 6;

// Recursively collect all .ts files inside any 'migrations' directory within a root
const collectMigrationFiles = (dir, depth = 0) => {
  // Prevent infinite recursion by limiting depth
  if (depth > MAX_DEPTH) return [];

  // Store results
  const results = [];

  // Read directory entries, if it fails (e.g. due to permissions), return empty results
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  // Process each entry in the directory
  for (const entry of entries) {
    // Skip node_modules to avoid unnecessary processing
    if (entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);

    // Find the migrations directory and collect .ts files, otherwise continue searching subdirectories
    if (entry.isDirectory()) {
      if (entry.name === "migrations") {
        for (const f of fs.readdirSync(fullPath)) {
          if (f.endsWith(".ts")) results.push(path.join(fullPath, f));
        }
      } else {
        results.push(...collectMigrationFiles(fullPath, depth + 1));
      }
    }
  }

  return results;
}

try {
  // Get the input 'paths'
  const paths = core.getInput("paths").split("\n").map(path => path.trim()).filter(path => path.length > 0);

  // Log the paths to check for pending migrations
  for (const projectPath of paths) {
    const projectDir = projectPath;
    core.info(`Checking for pending migrations in path: ${projectPath}`);

    // Snapshot all existing migration .ts files before running the command
    const beforeFiles = new Set(collectMigrationFiles(projectDir));

    // Run the migrate check command, a dummy secret is required as otherwise the command will error before it can check for pending migrations
    execSync("npm run payload migrate:create --skip-empty", { cwd: projectDir, stdio: "ignore", env: { ...process.env, PAYLOAD_SECRET: "PAYLOAD_SECRET" } });

    // Find any new migration .ts files by comparing snapshots
    const newMigrations = collectMigrationFiles(projectDir).filter(f => !beforeFiles.has(f));

    // If there are new migration files, we have pending migrations
    if (newMigrations.length > 0) {
      hasPendingMigrations = true;
      core.setFailed(`Pending migrations detected in path: ${projectPath}.`);
      break;
    }
  }

  core.setOutput("has-pending-migrations", hasPendingMigrations);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error));
}