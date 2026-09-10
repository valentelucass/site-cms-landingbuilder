import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Somente o artefato de teste, em porta própria. Nunca inicia DEV, PM2 ou produção.
const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifact = path.join(frontend, "dist-prod.test");
assert(existsSync(path.join(artifact, "server.js")), "Prepare dist-prod.test com NEXT_BUILD_DIST_DIR=.next.test e npm run build:prod.");
assert.equal(JSON.parse(readFileSync(path.join(artifact, "build-info.json"), "utf8")).staticAssets, ".next.test/static");
const port = 42513;
await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});
const origin = `http://127.0.0.1:${port}`;
const serverEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|systemroot|windir|temp|tmp|comspec)$/i.test(key)));
const server = spawn(process.execPath, [path.join(artifact, "server.js")], {
  cwd: artifact, windowsHide: true, stdio: "ignore",
  env: { ...serverEnv, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port), NEXT_TELEMETRY_DISABLED: "1" },
});
let serverError;
server.on("error", (error) => { serverError = error; });
const serverExit = new Promise((resolve) => server.once("close", resolve));
try {
  let ready = false;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    assert.equal(server.exitCode, null, "O servidor isolado encerrou antes do teste.");
    try { ready = (await fetch(`${origin}/admin/auth/entrar`, { signal: AbortSignal.timeout(2000) })).ok; } catch { /* Aguarda apenas este artefato. */ }
    if (ready) break;
    await delay(200);
  }
  assert(ready, "O artefato isolado não ficou pronto.");
  console.log(`UI isolada: dist-prod.test em ${origin}; todas as APIs e mídias simuladas.`);
  const test = spawn(process.execPath, [path.join(frontend, "scripts/test-notifications.mjs")], {
    cwd: frontend, windowsHide: true, stdio: "inherit",
    env: { ...serverEnv, CMS_NOTIFICATION_TEST_URL: origin, CMS_UI_ISOLATED_TEST: "1",
      ...(process.env.CMS_TEST_BROWSER_PATH ? { CMS_TEST_BROWSER_PATH: process.env.CMS_TEST_BROWSER_PATH } : {}),
      CMS_NOTIFICATION_TEST_SCREENSHOTS: process.env.CMS_NOTIFICATION_TEST_SCREENSHOTS ?? "0" },
  });
  const code = await new Promise((resolve, reject) => { test.once("error", reject); test.once("exit", resolve); });
  assert.equal(code, 0, "A regressão da UI falhou.");
} finally {
  if (server.exitCode === null && !serverError) server.kill();
  await serverExit;
}
