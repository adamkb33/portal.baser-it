// Core
export interface ApiError { code: string; message: string; field?: string; details?: string; }
export interface ApiMeta { total?: number; requestId?: string; pagination?: PaginationMeta; sorting?: SortingMeta; filtering?: FilteringMeta; }
export interface PaginationMeta { page: number; size: number; totalElements: number; totalPages: number; }
export interface SortingMeta { sortBy: string; direction: string; }
export interface FilteringMeta { appliedFilters: Record<string, unknown>; }
