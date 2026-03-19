export interface PostSummary {
  id: number;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Post extends PostSummary {
  content: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
}
