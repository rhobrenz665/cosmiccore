import assert from "node:assert/strict";
import test from "node:test";
import { fingerprintPayload, MutationError } from "../src/lib/db/mutation-core.ts";
import { accountQuotaLimits, quotaMetrics, readQuotaPolicy } from "../src/lib/db/quota-policy.ts";

test("equivalent JSON objects fingerprint identically without conflating types or array order", () => {
  assert.equal(fingerprintPayload({ title: "A", tags: ["x", "y"] }), fingerprintPayload({ tags: ["x", "y"], title: "A" }));
  assert.notEqual(fingerprintPayload(["x", "y"]), fingerprintPayload(["y", "x"]));
  assert.notEqual(fingerprintPayload(1), fingerprintPayload("1"));
  assert.notEqual(fingerprintPayload(null), fingerprintPayload("null"));
});

test("invalid, cyclic and oversized retry payloads fail validation", () => {
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  for (const payload of [undefined, NaN, Infinity, { missing: undefined }, new Date(), cycle, "x".repeat(1024 * 1024), Array(129).fill(null)]) {
    assert.throws(() => fingerprintPayload(payload), (error) => error instanceof MutationError && error.code === "VALIDATION");
  }
});

test("missing, malformed and unsafe global limits fail closed; zero is an explicit limit", () => {
  const env = Object.fromEntries(quotaMetrics.map((metric) => [`COSMICCORE_GLOBAL_${metric.toUpperCase()}_LIMIT`, "0"]));
  assert.deepEqual(readQuotaPolicy(env).account, accountQuotaLimits);
  assert.equal(readQuotaPolicy(env).global.notes_count, 0);
  assert.throws(() => readQuotaPolicy({}));
  for (const bad of ["-1", "1.5", "1e3", "Infinity", "9007199254740992", " 10", ""]) {
    assert.throws(() => readQuotaPolicy({ ...env, COSMICCORE_GLOBAL_NOTES_COUNT_LIMIT: bad }));
  }
});
