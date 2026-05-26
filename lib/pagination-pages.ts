export type PaginationPageItem = number | "ellipsis";

export function getPaginationPageItems(
  currentPage: number,
  totalPages: number,
  windowSize = 5,
): PaginationPageItem[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage)), safeTotal);
  const safeWindow = Math.max(1, Math.floor(windowSize));

  if (safeTotal <= safeWindow + 2) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const firstPage = 1;
  const lastPage = safeTotal;
  const windowStart = Math.min(
    Math.max(safeCurrent, 2),
    Math.max(2, lastPage - safeWindow),
  );
  const windowEnd = Math.min(windowStart + safeWindow - 1, lastPage - 1);
  const items: PaginationPageItem[] = [firstPage];

  if (windowStart > firstPage + 1) {
    items.push("ellipsis");
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page);
  }

  if (windowEnd < lastPage - 1) {
    items.push("ellipsis");
  }

  items.push(lastPage);
  return items;
}
