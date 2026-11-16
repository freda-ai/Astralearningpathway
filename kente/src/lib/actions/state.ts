export interface ActionState {
  error?: string;
  message?: string;
  /** Bumps on each success so client forms can reset/close. */
  ok?: number;
  data?: Record<string, string>;
}

export const initialState: ActionState = {};

/** Postgres raises our own guard messages as plain exceptions; surface them, hide the rest. */
export function dbError(e: unknown, fallback = "Something went wrong. Please try again."): ActionState {
  const err = e as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  const code = err.cause?.code ?? err.code;
  const msg = err.cause?.message ?? err.message ?? "";
  if (code === "42501") return { error: "You do not have permission to do that." };
  if (code === "23505") return { error: "That already exists." };
  if (code === "P0001") return { error: msg.charAt(0).toUpperCase() + msg.slice(1) + "." };
  console.error(e);
  return { error: fallback };
}

export const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
