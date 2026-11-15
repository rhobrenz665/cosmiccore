type Connection = {
  connect: () => Promise<unknown>;
  end: () => Promise<unknown>;
  on?: (event: "error", listener: (error: Error) => void) => unknown;
  removeListener?: (event: "error", listener: (error: Error) => void) => unknown;
};

function bounded<T>(work: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Keep this timer referenced: a dead socket may leave no other event-loop
    // handles, which otherwise exits Node before finally/fixture cleanup runs.
    const timer = setTimeout(() => reject(new Error("Database connection operation timed out; outcome may be uncertain.")), milliseconds);
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

// Internal lifecycle shared by the real transport and deterministic fault tests.
// A timeout/error can leave an uncertain commit: propagate, never auto-retry.
export async function withConnection<T>(
  client: Connection,
  work: () => Promise<T>,
  cleanupFailed: () => void,
  limits = { operationTimeoutMs: 20_000, cleanupTimeoutMs: 2_000 },
): Promise<T> {
  let connectionFailed!: (error: Error) => void;
  const failure = new Promise<never>((_, reject) => { connectionFailed = reject; });
  client.on?.("error", connectionFailed);
  try {
    return await bounded(Promise.race([
      (async () => { await client.connect(); return work(); })(),
      failure,
    ]), limits.operationTimeoutMs);
  } finally {
    try {
      await bounded(Promise.resolve().then(() => client.end()), limits.cleanupTimeoutMs);
    } catch {
      // Do not turn acknowledged success into failure, or mask the original
      // error, when end() rejects or never settles after a socket disconnect.
      cleanupFailed();
    } finally {
      client.removeListener?.("error", connectionFailed);
    }
  }
}
