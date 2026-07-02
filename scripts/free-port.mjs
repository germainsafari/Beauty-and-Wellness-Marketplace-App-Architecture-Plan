import { execSync } from "node:child_process";

const port = process.argv[2];
if (!port) {
  console.error("Usage: node scripts/free-port.mjs <port>");
  process.exit(1);
}

function freePortWindows(targetPort) {
  const output = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
  const pids = new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/).pop())
      .filter((pid) => pid && pid !== "0" && /^\d+$/.test(pid))
  );
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Freed port ${targetPort} (stopped PID ${pid})`);
    } catch {
      /* process may already have exited */
    }
  }
}

function freePortUnix(targetPort) {
  execSync(`lsof -ti:${targetPort} | xargs -r kill -9`, { stdio: "ignore", shell: true });
}

try {
  if (process.platform === "win32") freePortWindows(port);
  else freePortUnix(port);
} catch {
  /* port already free */
}
