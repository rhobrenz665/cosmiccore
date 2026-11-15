export const quotaMetrics = [
  "notes_count", "notes_bytes", "references_count", "references_bytes",
  "collections_count", "tags_count", "mutations_count",
] as const;
export type QuotaMetric = typeof quotaMetrics[number];
export type QuotaLimits = Record<QuotaMetric, number>;
export type UsageChanges = Partial<Record<Exclude<QuotaMetric, "mutations_count">, number>>;
export type QuotaPolicy = { account: QuotaLimits; global: QuotaLimits };

// Initial application defaults from the reviewed feature proposals, not vendor
// allowances. Global capacity must be supplied explicitly by the operator.
export const accountQuotaLimits: Readonly<QuotaLimits> = Object.freeze({
  notes_count: 200, notes_bytes: 10 * 1024 * 1024,
  references_count: 500, references_bytes: 5 * 1024 * 1024,
  collections_count: 50, tags_count: 100, mutations_count: 60,
});

export function readQuotaPolicy(environment: Record<string, string | undefined>): QuotaPolicy {
  const global = {} as QuotaLimits;
  for (const metric of quotaMetrics) {
    const name = `COSMICCORE_GLOBAL_${metric.toUpperCase()}_LIMIT`;
    const value = environment[name];
    if (!value || !/^(0|[1-9][0-9]*)$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error(`Configure ${name} as a nonnegative safe integer before enabling mutations.`);
    }
    global[metric] = Number(value);
  }
  return { account: { ...accountQuotaLimits }, global };
}
