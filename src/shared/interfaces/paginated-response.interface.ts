export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  items: T[];
}
