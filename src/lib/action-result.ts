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
    // Log the actual error on server side for debugging without leaking secrets
    console.error("[Action Error]:", err.message);
    return errorResult(err.message);
  }
  return errorResult("An unexpected error occurred. Please try again.");
}
