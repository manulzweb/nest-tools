export type SortOrder = 'ASC' | 'DESC' | 'asc' | 'desc';

export class PaginationQueryDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string;
  order?: SortOrder = 'ASC';
  search?: string;

  get skip(): number {
    const p = Number(this.page) || 1;
    const l = Number(this.limit) || 10;
    return (Math.max(p, 1) - 1) * Math.max(l, 1);
  }

  get take(): number {
    return Math.max(Number(this.limit) || 10, 1);
  }
}
