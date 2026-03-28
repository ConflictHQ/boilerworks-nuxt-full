import type { MutationResult, PaginatedResult } from "~/types";

export function ok<T>(data?: T): MutationResult<T> {
  return { ok: true, data };
}

export function fail(errors: string[]): MutationResult {
  return { ok: false, errors };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return { ok: true, data, total, page, pageSize };
}
