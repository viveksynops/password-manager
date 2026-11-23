export type ActionResult<T = void> =
  { success: true; data: T } | { success: false; error: string; code?: string };

export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function errorResult(error: string, code?: string): ActionResult<never> {
  return { success: false, error, code };
}

export function handleActionError(err: unknown): ActionResult<never> {
  if (err instanceof Error) {
    // Log error on server side for debugging without leaking internal database schema
    console.error("[Action Error]:", err.message);

    const msg = err.message.toLowerCase();
    // Scrub internal database, Postgres, RLS or cipher errors into a safe message
    if (
      msg.includes("relation") ||
      msg.includes("column") ||
      msg.includes("syntax error") ||
      msg.includes("violates") ||
      msg.includes("pg_") ||
      msg.includes("decryption failed") ||
      msg.includes("unable to authenticate data")
    ) {
      return errorResult("A secure database error occurred. Please try again.");
    }

    return errorResult(err.message);
  }
  return errorResult("An unexpected error occurred. Please try again.");
}
