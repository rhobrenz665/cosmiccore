import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const configPath = ".env.acceptance.local";
if (!existsSync(configPath)) {
  process.exitCode = 1;
  console.error(`Missing ${configPath}. Configure the isolated development database before starting.`);
} else {
  start(parseEnv(readFileSync(configPath, "utf8")));
}

function start(config) {
  let pooled;
  try {
    pooled = new URL(config.COSMICCORE_TEST_DATABASE_URL);
  } catch {
    console.error(`Set COSMICCORE_TEST_DATABASE_URL in ${configPath} to the isolated development database URL.`);
    process.exitCode = 1;
    return;
  }

  if (config.COSMICCORE_TEST_PROJECT_ID !== "lingering-fire-94844546" ||
      pooled.protocol !== "postgresql:" ||
      pooled.hostname !== "ep-rough-pond-azt24vit-pooler.c-3.ap-southeast-1.aws.neon.tech" ||
      pooled.pathname !== "/cosmiccore_dev") {
    console.error("Refusing to start with an unexpected isolated development database target.");
    process.exitCode = 1;
    return;
  }

  const direct = new URL(pooled);
  direct.hostname = direct.hostname.replace("-pooler", "");
  const cert = "certificates/localhost.pem";
  const key = "certificates/localhost-key.pem";
  const tlsArgs = existsSync(cert) && existsSync(key)
    ? ["--experimental-https-key", key, "--experimental-https-cert", cert]
    : [];

  console.log("Starting HTTPS with the isolated cosmiccore_dev database.");
  const child = spawn(process.execPath, [
    "node_modules/next/dist/bin/next", "dev", "--webpack", "--experimental-https", ...tlsArgs,
  ], {
    env: { ...process.env, DATABASE_URL: pooled.href, DATABASE_URL_UNPOOLED: direct.href },
    stdio: "inherit",
  });
  child.on("error", () => {
    console.error("Could not start the Next.js development server.");
    process.exitCode = 1;
  });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
