import { getQuery } from "h3";
import type { H3Event } from "h3";

export function getPaginationParams(event: H3Event): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const query = getQuery(event);
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(query.pageSize ?? "20"), 10)),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}
