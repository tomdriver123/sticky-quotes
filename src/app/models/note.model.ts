/**
 * A note is body + timestamps. There is deliberately no title field —
 * not here, not in the UI, not in the file on disk (constitutional; see
 * vault/projects/sticky-quotes/decisions.md).
 */
export interface Note {
  /** Filename without `.md`, e.g. "2026-07-24T09-12-00-a1b2c3". Server-generated. */
  id: string;
  body: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 — updated on every save */
  editedAt: string;
}
