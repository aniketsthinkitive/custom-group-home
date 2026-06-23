// Response shaping helpers.
//
// The app consumes API responses in more than one convention:
//   - DRF-style lists:        { count, next, previous, results }
//   - Custom wrapper lists:    { status, code, message, data: { results, pagination } }
//   - Single-object wrapper:   { status, code, message, data: <object> }
// To maximize compatibility without re-reading every screen, the list envelope below is a
// SUPERSET that carries both the DRF fields and the custom-wrapper `data` shape.

export interface PageParams {
  page: number;
  size: number;
  search: string;
}

export function readPageParams(query: Record<string, string>): PageParams {
  const page = Number(query.page ?? '1') || 1;
  const size = Number(query.size ?? query.page_size ?? '10') || 10;
  const search = (query.search ?? '').toLowerCase();
  return { page, size, search };
}

/** Case-insensitive "any string field contains the search term" filter. */
export function applySearch<T>(items: T[], search: string): T[] {
  if (!search) return items;
  return items.filter((item) => {
    try {
      return JSON.stringify(item).toLowerCase().includes(search);
    } catch {
      return true;
    }
  });
}

export function listEnvelope<T>(allItems: T[], params: PageParams) {
  const filtered = applySearch(allItems, params.search);
  const count = filtered.length;
  const start = (params.page - 1) * params.size;
  const results = filtered.slice(start, start + params.size);
  const totalPages = Math.max(1, Math.ceil(count / params.size));

  // Pagination object with every alias the various tables read (total_records, totalElements,
  // total_pages, current_page, page_size, ...) so server-side paginators show correct totals.
  const pagination = {
    count,
    total: count,
    total_records: count,
    totalRecords: count,
    total_elements: count,
    totalElements: count,
    total_pages: totalPages,
    totalPages,
    page: params.page,
    current_page: params.page,
    currentPage: params.page,
    number: params.page - 1,
    size: params.size,
    page_size: params.size,
    pageSize: params.size,
    has_next: params.page < totalPages,
    has_previous: params.page > 1,
  };

  return {
    status: 'success',
    code: 200,
    message: 'OK',
    // DRF-style fields (top level)
    count,
    next: params.page < totalPages ? `?page=${params.page + 1}` : null,
    previous: params.page > 1 ? `?page=${params.page - 1}` : null,
    results,
    pagination,
    // Custom-wrapper shape
    data: {
      results,
      count,
      total_records: count,
      totalElements: count,
      totalPages,
      number: params.page - 1,
      size: params.size,
      pagination,
    },
  };
}

/** Single-object success wrapper ({ status, data }). */
export function itemEnvelope<T>(item: T) {
  return { status: 'success', code: 200, message: 'OK', data: item };
}

/** Generic success with no specific body. */
export function okEnvelope(message = 'OK') {
  return { status: 'success', code: 200, message, data: {} };
}
