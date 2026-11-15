import assert from "node:assert/strict";
import test from "node:test";
import { withConnection } from "../src/lib/db/connection-lifecycle.ts";

for (const stage of ["connect", "work", "uncertain commit"] as const) {
  test(`${stage} failure closes once, preserves the error and never retries`, async () => {
    const failure = new Error(stage);
    let opened = 0;
    let calls = 0;
    let closed = 0;
    let reports = 0;
    let commits = 0;
    const client = {
      connect: async () => { opened++; if (stage === "connect") throw failure; },
      end: async () => { closed++; throw new Error("cleanup failed"); },
    };
    await assert.rejects(withConnection(client, async () => {
      calls++;
      // Model an unknown outcome: durable work may have committed before its
      // acknowledgment was lost. The lifecycle must not run it a second time.
      if (stage === "uncertain commit") commits++;
      throw failure;
    }, () => { reports++; }), (error) => error === failure);
    assert.equal(opened, 1);
    assert.equal(calls, stage === "connect" ? 0 : 1);
    assert.equal(closed, 1);
    assert.equal(reports, 1);
    assert.equal(commits, stage === "uncertain commit" ? 1 : 0);
  });
}
test("close failure preserves acknowledged success; next operation uses a fresh connection", async () => {
  let closed = 0;
  let reports = 0;
  const client = () => ({ connect: async () => {}, end: async () => { closed++; throw new Error("close"); } });
  assert.equal(await withConnection(client(), async () => "committed", () => { reports++; }), "committed");
  assert.equal(await withConnection(client(), async () => "fresh", () => { reports++; }), "fresh");
  assert.equal(closed, 2);
  assert.equal(reports, 2);
});

test("stalled disconnect paths settle and run cleanup instead of unsettled top-level await", async () => {
  const { spawnSync } = await import("node:child_process");
  const moduleUrl = new URL("../src/lib/db/connection-lifecycle.ts", import.meta.url).href;
  for (const stalled of ["connect", "work", "close"]) {
    const child = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", `
      import { withConnection } from ${JSON.stringify(moduleUrl)};
      const never = () => new Promise(() => {});
      let closed = 0;
      try {
        await withConnection({ connect: async () => { if (${JSON.stringify(stalled)} === 'connect') await never(); }, end: async () => { closed++; if (${JSON.stringify(stalled)} === 'close') await never(); } },
          async () => { if (${JSON.stringify(stalled)} === 'work') await never(); throw new Error('original'); },
          () => {}, { operationTimeoutMs: 30, cleanupTimeoutMs: 30 });
      } catch { if (closed !== 1) process.exitCode = 2; }
      console.log('settled');
    `], { encoding: "utf8", timeout: 1000 });
    assert.equal(child.status, 0, `${stalled}: ${child.stderr}`);
    assert.match(child.stdout, /settled/);
  }
});

test("connection error escapes stalled rollback and detaches its listener", async () => {
  const { EventEmitter } = await import("node:events");
  const failure = new Error("Connection terminated unexpectedly");
  let closed = 0;
  const client = Object.assign(new EventEmitter(), {
    connect: async () => {},
    end: async () => { closed++; },
  });
  const result = withConnection(client, async () => {
    queueMicrotask(() => client.emit("error", failure));
    return new Promise<never>(() => {});
  }, () => {}, { operationTimeoutMs: 100, cleanupTimeoutMs: 30 });
  await assert.rejects(result, (error) => error === failure);
  assert.equal(closed, 1);
  assert.equal(client.listenerCount("error"), 0);
});
