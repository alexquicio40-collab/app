export function isNetworkError(err: unknown) {
  if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
    return true;
  }
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /network request failed|failed to fetch|internet|offline|network error|timed out|timeout|abort|agotó el tiempo/i.test(
    message,
  );
}

export function isQueuedResult(value: unknown): value is { success: true; queued: true } {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { queued?: unknown }).queued === true &&
      (value as { success?: unknown }).success === true,
  );
}
