import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../../.env");

function detectLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const entries of Object.values(nets)) {
    for (const net of entries ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      candidates.push(net.address);
    }
  }

  const preferred =
    candidates.find((ip) => ip.startsWith("192.168.")) ??
    candidates.find((ip) => ip.startsWith("10.")) ??
    candidates[0];

  return preferred ?? "localhost";
}

function syncApiUrl() {
  const ip = detectLanIp();
  const apiUrl = `http://${ip}:3001`;

  if (!fs.existsSync(rootEnv)) {
    fs.writeFileSync(rootEnv, `EXPO_PUBLIC_API_URL=${apiUrl}\n`, "utf8");
    console.log(`Created .env with EXPO_PUBLIC_API_URL=${apiUrl}`);
    return apiUrl;
  }

  let content = fs.readFileSync(rootEnv, "utf8");
  if (/^EXPO_PUBLIC_API_URL=/m.test(content)) {
    content = content.replace(/^EXPO_PUBLIC_API_URL=.*$/m, `EXPO_PUBLIC_API_URL=${apiUrl}`);
  } else {
    content = content.trimEnd() + `\nEXPO_PUBLIC_API_URL=${apiUrl}\n`;
  }
  fs.writeFileSync(rootEnv, content, "utf8");
  console.log(`Mobile API URL → ${apiUrl}`);
  return apiUrl;
}

syncApiUrl();
