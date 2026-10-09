/**
 * UTC date boundary helpers for Prisma @db.Date queries.
 *
 * PostgreSQL DATE columns store dates at UTC midnight (T00:00:00.000Z).
 * date-fns functions like startOfDay() use the server's LOCAL timezone,
 * which on an IST machine turns "today" into "yesterday 18:30 UTC" — causing
 * queries to accidentally include yesterday's records.
 *
 * These helpers always produce UTC midnight boundaries, matching what Prisma stores.
 */

/** Today at UTC 00:00:00.000Z */
export function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Today at UTC 23:59:59.999Z */
export function utcEndOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
}

/** Monday of the current ISO week at UTC 00:00:00Z (weekStartsOn: Monday) */
export function utcStartOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? 6 : day - 1; // distance back to Monday
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() - diff));
}

/** Sunday of the current ISO week at UTC 23:59:59.999Z */
export function utcEndOfWeek(d: Date): Date {
  const start = utcStartOfWeek(d);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
}

/** 1st of current month at UTC 00:00:00Z */
export function utcStartOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
}

/** Last day of current month at UTC 23:59:59.999Z */
export function utcEndOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
}

/** Jan 1st of current year at UTC 00:00:00Z */
export function utcStartOfYear(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), 0, 1));
}

/** Dec 31st of current year at UTC 23:59:59.999Z */
export function utcEndOfYear(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), 11, 31, 23, 59, 59, 999));
}
