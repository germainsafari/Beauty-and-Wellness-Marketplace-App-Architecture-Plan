import { spawnSync } from "node:child_process";

const checks = [
  ["API typecheck", "npx", ["tsc", "-p", "apps/api/tsconfig.json", "--noEmit"]],
  ["Web typecheck", "npx", ["tsc", "-p", "apps/web/tsconfig.json", "--noEmit"]],
  ["Web production build", "npm", ["run", "web:build"]],
  ["Mobile typecheck", "npx", ["tsc", "-p", "apps/mobile/tsconfig.json", "--noEmit"]],
];

for (const [label, command, args] of checks) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nProduction verification passed.");
