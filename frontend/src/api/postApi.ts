import api from './axiosInstance';
import type { Post, PostSummary, PagedResponse } from '../types';

export const getPosts = (page = 0, size = 6) =>
  api.get<PagedResponse<PostSummary>>('/api/posts', { params: { page, size } });

export const getPost = (id: number) =>
  api.get<Post>(`/api/posts/${id}`);

// Let the browser set Content-Type with the correct multipart boundary automatically.
export const createPost = (formData: FormData) =>
  api.post<Post>('/api/posts', formData);

export const updatePost = (id: number, formData: FormData) =>
  api.put<Post>(`/api/posts/${id}`, formData);

export const deletePost = (id: number) =>
  api.delete(`/api/posts/${id}`);
